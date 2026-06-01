"""
Recruiter Router

Endpoints for recruiters to:
- Create and manage job postings
- Rank candidates via matching engine
- View candidate shortlists
- Take actions on candidates (advance, flag, reject)
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import logging

from backend.database import get_db
from backend.models import JobPosting, MatchScore, Resume, Company, User
from backend.schemas import JobPosting as JobPostingSchema
from backend.utils.ai import (
    extract_job_spec,
    generate_embedding,
    generate_match_score,
    semantic_search,
)
from backend.utils.cache import get_match_score, set_match_score, invalidate_cache
from backend.utils.auth import role_required

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recruiter", tags=["recruiter"])


# ============================================================================
# JOB POSTING ENDPOINTS
# ============================================================================


@router.post("/jobs", response_model=dict)
async def create_job_posting(
    title: str,
    description: str,
    company_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """
    Create a new job posting.
    
    - Extracts structured job spec from description
    - Generates embedding for semantic search
    - Stores in database
    """
    try:
        # Verify company ownership
        company = await db.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Verify user belongs to company
        user_db = await db.get(User, user.get("user_id"))
        if not user_db or user_db.company_id != company_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        logger.info(f"Extracting job spec for: {title}")
        
        # Extract structured spec from description
        extracted_spec = await extract_job_spec(description)
        
        # Generate embedding for semantic search
        embedding = await generate_embedding(description)
        
        # Create job posting
        new_job = JobPosting(
            company_id=company_id,
            title=title,
            raw_description=description,
            extracted_spec=extracted_spec,
            embedding=embedding,
            status="active",
        )
        
        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)
        
        logger.info(f"Job posting created: {new_job.id}")
        
        return {
            "id": new_job.id,
            "title": new_job.title,
            "company_id": new_job.company_id,
            "status": new_job.status,
            "extracted_spec": new_job.extracted_spec,
            "created_at": new_job.created_at.isoformat(),
        }
    except Exception as e:
        logger.error(f"Error creating job posting: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating job: {str(e)}")


@router.get("/jobs")
async def list_jobs(
    company_id: int,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """List all job postings for a company."""
    try:
        query = select(JobPosting).where(JobPosting.company_id == company_id)
        if status:
            query = query.where(JobPosting.status == status)
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [
            {
                "id": j.id,
                "title": j.title,
                "status": j.status,
                "created_at": j.created_at.isoformat(),
            }
            for j in jobs
        ]
    except Exception as e:
        logger.error(f"Error listing jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}")
async def get_job_details(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """Get detailed information about a specific job posting."""
    try:
        job = await db.get(JobPosting, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "id": job.id,
            "title": job.title,
            "raw_description": job.raw_description,
            "extracted_spec": job.extracted_spec,
            "status": job.status,
            "created_at": job.created_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CANDIDATE RANKING ENDPOINTS (2-STAGE MATCHING ENGINE)
# ============================================================================


@router.post("/jobs/{job_id}/rank-candidates")
async def rank_candidates(
    job_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """
    Rank all candidates for a job posting.
    
    2-Stage Process:
    1. Semantic Retrieval: Get top-50 resumes via vector similarity
    2. LLM Scoring: Score each candidate with detailed breakdown
    
    Returns 202 Accepted (async job)
    """
    try:
        job = await db.get(JobPosting, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        logger.info(f"Starting candidate ranking for job {job_id}")
        
        # Stage 1: Semantic retrieval
        logger.info("Stage 1: Semantic retrieval...")
        top_resumes = await semantic_search(db, job.embedding, limit=50)
        
        if not top_resumes:
            logger.warning(f"No resumes found for job {job_id}")
            return {
                "message": "No resumes found for ranking",
                "job_id": job_id,
                "candidates_ranked": 0,
            }
        
        logger.info(f"Found {len(top_resumes)} candidate resumes")
        
        # Stage 2: LLM scoring
        logger.info("Stage 2: LLM scoring...")
        scored_count = 0
        
        for resume in top_resumes:
            try:
                # Check if score already exists
                existing_score_query = select(MatchScore).where(
                    and_(
                        MatchScore.job_posting_id == job_id,
                        MatchScore.resume_id == resume.id,
                    )
                )
                existing_score = (await db.execute(existing_score_query)).scalar_one_or_none()
                
                if not existing_score:
                    # Generate match score
                    match_data = await generate_match_score(
                        resume.extracted_profile or {},
                        job.extracted_spec or {},
                    )
                    
                    # Store match score
                    new_score = MatchScore(
                        job_posting_id=job_id,
                        resume_id=resume.id,
                        overall_score=match_data.get("overall_score", 0),
                        score_breakdown=match_data.get("score_breakdown", {}),
                        rationale=match_data.get("summary_rationale", ""),
                    )
                    db.add(new_score)
                    scored_count += 1
            except Exception as e:
                logger.error(f"Error scoring resume {resume.id}: {str(e)}")
                continue
        
        await db.commit()
        logger.info(f"Ranked {scored_count} candidates for job {job_id}")
        
        return {
            "message": "Candidates ranked successfully",
            "job_id": job_id,
            "candidates_ranked": scored_count,
            "total_candidates": len(top_resumes),
        }
    except Exception as e:
        logger.error(f"Error in rank_candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}/candidates")
async def get_ranked_candidates(
    job_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """
    Get ranked candidate shortlist for a job.
    
    Returns candidates sorted by overall_score (descending).
    Includes match breakdown, required/missing skills, and rationale.
    """
    try:
        job = await db.get(JobPosting, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get match scores for this job, sorted by score
        query = (
            select(MatchScore, Resume)
            .join(Resume)
            .where(MatchScore.job_posting_id == job_id)
            .order_by(MatchScore.overall_score.desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        candidates = []
        
        for score, resume in result:
            candidate = {
                "resume_id": resume.id,
                "user_id": resume.user_id,
                "overall_score": score.overall_score,
                "score_breakdown": score.score_breakdown,
                "rationale": score.rationale,
                "profile": resume.extracted_profile,
                "scored_at": score.computed_at.isoformat(),
            }
            candidates.append(candidate)
        
        return {
            "job_id": job_id,
            "job_title": job.title,
            "total_candidates": len(candidates),
            "candidates": candidates,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}/candidates/{resume_id}/details")
async def get_candidate_details(
    job_id: int,
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """Get detailed match analysis for a specific candidate."""
    try:
        # Get match score
        query = select(MatchScore).where(
            and_(
                MatchScore.job_posting_id == job_id,
                MatchScore.resume_id == resume_id,
            )
        )
        match_score = (await db.execute(query)).scalar_one_or_none()
        
        if not match_score:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get resume
        resume = await db.get(Resume, resume_id)
        
        return {
            "resume_id": resume_id,
            "overall_score": match_score.overall_score,
            "score_breakdown": match_score.score_breakdown,
            "rationale": match_score.rationale,
            "extracted_profile": resume.extracted_profile,
            "scored_at": match_score.computed_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching candidate details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CANDIDATE ACTION ENDPOINTS
# ============================================================================


@router.post("/candidates/{resume_id}/advance")
async def advance_candidate(
    resume_id: int,
    job_id: int,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """Mark candidate as advanced to next stage."""
    # TODO: Implement candidate pipeline tracking
    return {"message": "Candidate advanced", "resume_id": resume_id, "job_id": job_id}


@router.post("/candidates/{resume_id}/reject")
async def reject_candidate(
    resume_id: int,
    job_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(role_required(["recruiter"])),
):
    """Mark candidate as rejected."""
    # TODO: Implement candidate pipeline tracking
    return {"message": "Candidate rejected", "resume_id": resume_id, "job_id": job_id}

