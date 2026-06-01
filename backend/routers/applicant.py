"""
Applicant Router

Endpoints for applicants to:
- Upload and parse resume
- View job postings
- Analyze gap against specific job
- View remediation advice
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
import logging

from backend.database import get_db
from backend.models import Resume, JobPosting, GapReport, User
from backend.utils.parser import extract_text, prepare_for_extraction, estimate_resume_quality
from backend.utils.ai import (
    extract_resume_profile,
    generate_embedding,
    generate_gap_analysis,
    generate_match_score,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applicant", tags=["applicant"])


# ============================================================================
# RESUME UPLOAD & PARSING
# ============================================================================


@router.post("/resume/upload")
async def upload_resume(
    user_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and parse resume file (PDF or DOCX).
    
    Process:
    1. Extract raw text from file
    2. Parse and clean text
    3. Extract structured profile (skills, experience, education)
    4. Generate embedding for semantic search
    5. Store in database
    
    Returns 202 Accepted with resume_id for polling progress.
    """
    try:
        # Verify user exists
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.role != "applicant":
            raise HTTPException(status_code=403, detail="Only applicants can upload resumes")
        
        logger.info(f"Processing resume upload for user {user_id}")
        
        # Extract raw text
        file_bytes = await file.read()
        raw_text = extract_text(file_bytes, file.filename)
        
        logger.info(f"Extracted {len(raw_text)} characters from resume")
        
        # Prepare for extraction
        prep_data = prepare_for_extraction(raw_text)
        cleaned_text = prep_data["cleaned_text"]
        metadata = prep_data["metadata"]
        
        # Estimate quality
        quality_check = estimate_resume_quality(raw_text, metadata)
        
        if not quality_check["is_valid"]:
            logger.warning(f"Resume quality check failed: {quality_check['issues']}")
            raise HTTPException(
                status_code=400,
                detail=f"Resume quality check failed: {', '.join(quality_check['issues'])}",
            )
        
        logger.info(f"Resume quality score: {quality_check['quality_score']}")
        
        # Extract structured profile
        logger.info("Extracting structured resume profile...")
        extracted_profile = await extract_resume_profile(cleaned_text)
        
        # Generate embedding
        logger.info("Generating embedding...")
        embedding = await generate_embedding(cleaned_text)
        
        # Store resume
        new_resume = Resume(
            user_id=user_id,
            s3_key=f"resumes/{user_id}/{file.filename}",
            raw_text=raw_text,
            extracted_profile=extracted_profile,
            embedding=embedding,
        )
        
        db.add(new_resume)
        await db.commit()
        await db.refresh(new_resume)
        
        logger.info(f"Resume stored with ID: {new_resume.id}")
        
        return {
            "resume_id": new_resume.id,
            "user_id": user_id,
            "filename": file.filename,
            "status": "processed",
            "quality_score": quality_check["quality_score"],
            "extracted_profile": extracted_profile,
            "created_at": new_resume.parsed_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading resume: {str(e)}")


# ============================================================================
# JOB POSTING RETRIEVAL
# ============================================================================


@router.get("/jobs")
async def list_jobs(
    company_id: Optional[int] = None,
    user_id: int = None,
    db: AsyncSession = Depends(get_db),
):
    """Get list of available job postings."""
    try:
        query = select(JobPosting).where(JobPosting.status == "active")
        
        if company_id:
            query = query.where(JobPosting.company_id == company_id)
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [
            {
                "job_id": j.id,
                "title": j.title,
                "company_id": j.company_id,
                "raw_description": j.raw_description[:500] + "..." if len(j.raw_description) > 500 else j.raw_description,
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
):
    """Get detailed job posting information."""
    try:
        job = await db.get(JobPosting, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job.id,
            "title": job.title,
            "company_id": job.company_id,
            "description": job.raw_description,
            "extracted_spec": job.extracted_spec,
            "created_at": job.created_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GAP ANALYSIS ENDPOINTS
# ============================================================================


@router.post("/gap-analysis")
async def analyze_resume_gap(
    resume_id: int,
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate gap analysis between resume and job.
    
    Process:
    1. Retrieve resume and job posting
    2. Generate match score
    3. Generate gap analysis with remediation advice
    4. Store in database
    
    Returns detailed gap report with actionable advice.
    """
    try:
        # Retrieve resume and job
        resume = await db.get(Resume, resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        job = await db.get(JobPosting, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        logger.info(f"Generating gap analysis for resume {resume_id} vs job {job_id}")
        
        # Generate match score
        logger.info("Generating match score...")
        match_data = await generate_match_score(
            resume.extracted_profile or {},
            job.extracted_spec or {},
        )
        
        # Generate gap analysis
        logger.info("Generating gap analysis and recommendations...")
        gap_data = await generate_gap_analysis(
            resume.extracted_profile or {},
            job.extracted_spec or {},
            match_data,
        )
        
        # Check for existing gap report
        existing_query = select(GapReport).where(
            and_(
                GapReport.resume_id == resume_id,
                GapReport.job_posting_id == job_id,
            )
        )
        existing_report = (await db.execute(existing_query)).scalar_one_or_none()
        
        if existing_report:
            # Update existing report
            existing_report.gaps = gap_data.get("gaps", [])
            existing_report.advisor_plan = gap_data.get("advisor_plan", [])
        else:
            # Create new report
            new_report = GapReport(
                resume_id=resume_id,
                job_posting_id=job_id,
                gaps=gap_data.get("gaps", []),
                advisor_plan=gap_data.get("advisor_plan", []),
            )
            db.add(new_report)
        
        await db.commit()
        
        logger.info(f"Gap analysis completed for resume {resume_id}")
        
        return {
            "resume_id": resume_id,
            "job_id": job_id,
            "match_score": match_data.get("overall_score", 0),
            "match_breakdown": match_data.get("score_breakdown", {}),
            "required_skills_matched": match_data.get("required_skills_matched", []),
            "required_skills_missing": match_data.get("required_skills_missing", []),
            "gaps": gap_data.get("gaps", []),
            "advisor_plan": gap_data.get("advisor_plan", []),
            "priority_roadmap": gap_data.get("priority_roadmap", []),
            "interview_preparation": gap_data.get("interview_preparation", {}),
            "generated_at": existing_report.generated_at.isoformat() if existing_report else "now",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in gap analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating gap analysis: {str(e)}")


@router.get("/gap-analysis/{resume_id}/{job_id}")
async def get_gap_analysis(
    resume_id: int,
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve previously generated gap analysis."""
    try:
        query = select(GapReport).where(
            and_(
                GapReport.resume_id == resume_id,
                GapReport.job_posting_id == job_id,
            )
        )
        report = (await db.execute(query)).scalar_one_or_none()
        
        if not report:
            raise HTTPException(status_code=404, detail="Gap analysis not found")
        
        return {
            "resume_id": resume_id,
            "job_id": job_id,
            "gaps": report.gaps,
            "advisor_plan": report.advisor_plan,
            "generated_at": report.generated_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching gap analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RESUME & HISTORY
# ============================================================================


@router.get("/resumes/{user_id}")
async def list_user_resumes(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get all resumes uploaded by a user."""
    try:
        query = select(Resume).where(Resume.user_id == user_id)
        result = await db.execute(query)
        resumes = result.scalars().all()
        
        return [
            {
                "resume_id": r.id,
                "filename": r.s3_key.split("/")[-1] if r.s3_key else "unknown",
                "parsed_at": r.parsed_at.isoformat(),
            }
            for r in resumes
        ]
    except Exception as e:
        logger.error(f"Error listing resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resumes/{resume_id}")
async def get_resume_profile(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed resume profile."""
    try:
        resume = await db.get(Resume, resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        return {
            "resume_id": resume.id,
            "user_id": resume.user_id,
            "extracted_profile": resume.extracted_profile,
            "parsed_at": resume.parsed_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

