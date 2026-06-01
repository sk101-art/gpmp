from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class JobPostingBase(BaseModel):
    title: str
    raw_description: str
    company_id: int

class JobPostingCreate(JobPostingBase):
    pass

class JobPosting(JobPostingBase):
    id: int
    extracted_spec: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeBase(BaseModel):
    user_id: int
    raw_text: str

class Resume(ResumeBase):
    id: int
    extracted_profile: Optional[Dict[str, Any]]
    s3_key: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MatchScore(BaseModel):
    id: int
    job_posting_id: int
    resume_id: int
    overall_score: float
    score_breakdown: Dict[str, Any]
    rationale: str
    created_at: datetime

    class Config:
        from_attributes = True
