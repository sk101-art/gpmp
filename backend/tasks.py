"""
Celery Tasks

Background processing tasks for:
- Resume extraction and embedding
- Match scoring
- Gap analysis
"""

import asyncio
import logging
from sqlalchemy import select

from backend.worker import celery_app
from backend.database import AsyncSessionLocal
from backend.models import Resume, JobPosting, MatchScore, GapReport
from backend.utils.ai import (
    extract_resume_profile,
    generate_embedding,
    generate_match_score,
    generate_gap_analysis,
)

logger = logging.getLogger(__name__)


async def process_resume_async(resume_id: int):
    """
    Async task: Extract profile and generate embedding for resume.
    """
    try:
        async with AsyncSessionLocal() as db:
            resume = await db.get(Resume, resume_id)
            if not resume:
                logger.error(f"Resume {resume_id} not found")
                return

            logger.info(f"Processing resume {resume_id}")

            # Extract profile if not already done
            if not resume.extracted_profile:
                logger.info("Extracting structured profile...")
                resume.extracted_profile = await extract_resume_profile(resume.raw_text)

            # Generate embedding
            logger.info("Generating embedding...")
            resume.embedding = await generate_embedding(resume.raw_text)

            await db.commit()
            logger.info(f"Resume {resume_id} processing complete")

    except Exception as e:
        logger.error(f"Error processing resume {resume_id}: {str(e)}")
        raise


async def generate_match_async(resume_id: int, job_id: int):
    """
    Async task: Generate match score between resume and job.
    """
    try:
        async with AsyncSessionLocal() as db:
            resume = await db.get(Resume, resume_id)
            job = await db.get(JobPosting, job_id)

            if not resume or not job:
                logger.error(f"Resume {resume_id} or Job {job_id} not found")
                return

            logger.info(f"Generating match for resume {resume_id} vs job {job_id}")

            # Generate match score
            match_data = await generate_match_score(
                resume.extracted_profile or {},
                job.extracted_spec or {},
            )

            # Check if score already exists
            existing_query = select(MatchScore).where(
                (MatchScore.job_posting_id == job_id) & (MatchScore.resume_id == resume_id)
            )
            existing_score = (await db.execute(existing_query)).scalar_one_or_none()

            if existing_score:
                existing_score.overall_score = match_data.get("overall_score", 0)
                existing_score.score_breakdown = match_data.get("score_breakdown", {})
                existing_score.rationale = match_data.get("summary_rationale", "")
            else:
                new_score = MatchScore(
                    job_posting_id=job_id,
                    resume_id=resume_id,
                    overall_score=match_data.get("overall_score", 0),
                    score_breakdown=match_data.get("score_breakdown", {}),
                    rationale=match_data.get("summary_rationale", ""),
                )
                db.add(new_score)

            await db.commit()
            logger.info(f"Match score generated: {match_data.get('overall_score', 0)}")

    except Exception as e:
        logger.error(f"Error generating match: {str(e)}")
        raise


async def generate_gap_async(resume_id: int, job_id: int):
    """
    Async task: Generate gap analysis and remediation advice.
    """
    try:
        async with AsyncSessionLocal() as db:
            resume = await db.get(Resume, resume_id)
            job = await db.get(JobPosting, job_id)

            if not resume or not job:
                logger.error(f"Resume {resume_id} or Job {job_id} not found")
                return

            logger.info(f"Generating gap analysis for resume {resume_id} vs job {job_id}")

            # Generate match score first
            match_data = await generate_match_score(
                resume.extracted_profile or {},
                job.extracted_spec or {},
            )

            # Generate gap analysis
            gap_data = await generate_gap_analysis(
                resume.extracted_profile or {},
                job.extracted_spec or {},
                match_data,
            )

            # Check if report already exists
            from sqlalchemy import and_

            existing_query = select(GapReport).where(
                and_(
                    GapReport.job_posting_id == job_id,
                    GapReport.resume_id == resume_id,
                )
            )
            existing_report = (await db.execute(existing_query)).scalar_one_or_none()

            if existing_report:
                existing_report.gaps = gap_data.get("gaps", [])
                existing_report.advisor_plan = gap_data.get("advisor_plan", [])
            else:
                new_gap = GapReport(
                    job_posting_id=job_id,
                    resume_id=resume_id,
                    gaps=gap_data.get("gaps", []),
                    advisor_plan=gap_data.get("advisor_plan", []),
                )
                db.add(new_gap)

            await db.commit()
            logger.info(f"Gap analysis generated")

    except Exception as e:
        logger.error(f"Error generating gap analysis: {str(e)}")
        raise


# ============================================================================
# Celery Task Wrappers
# ============================================================================


@celery_app.task(name="process_resume_task", bind=True, max_retries=3)
def process_resume_task(self, resume_id: int):
    """Celery wrapper for resume processing."""
    try:
        import asyncio
        return asyncio.run(process_resume_async(resume_id))
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60)


@celery_app.task(name="generate_match_task", bind=True, max_retries=3)
def generate_match_task(self, resume_id: int, job_id: int):
    """Celery wrapper for match scoring."""
    try:
        import asyncio
        return asyncio.run(generate_match_async(resume_id, job_id))
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@celery_app.task(name="generate_gap_task", bind=True, max_retries=3)
def generate_gap_task(self, resume_id: int, job_id: int):
    """Celery wrapper for gap analysis."""
    try:
        import asyncio
        return asyncio.run(generate_gap_async(resume_id, job_id))
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        raise self.retry(exc=e, countdown=60)

