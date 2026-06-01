from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Float, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from .database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    plan = Column(String, default="free")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="company")
    job_postings = relationship("JobPosting", back_populates="company")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    clerk_user_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)  # 'recruiter' or 'applicant'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="users")
    resumes = relationship("Resume", back_populates="user")

class JobPosting(Base):
    __tablename__ = "job_postings"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    title = Column(String, index=True)
    raw_description = Column(Text)
    extracted_spec = Column(JSON)  # Structured JSON of requirements
    embedding = Column(Vector(768))  # nomic-embed-text dimensions
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="job_postings")
    match_scores = relationship("MatchScore", back_populates="job_posting")
    gap_reports = relationship("GapReport", back_populates="job_posting")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    s3_key = Column(String)
    raw_text = Column(Text)
    extracted_profile = Column(JSON)  # Structured JSON of skills/experience
    embedding = Column(Vector(768))
    parsed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")
    match_scores = relationship("MatchScore", back_populates="resume")
    gap_reports = relationship("GapReport", back_populates="resume")

class MatchScore(Base):
    __tablename__ = "match_scores"
    id = Column(Integer, primary_key=True, index=True)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    overall_score = Column(Float)
    score_breakdown = Column(JSON)
    rationale = Column(Text)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    job_posting = relationship("JobPosting", back_populates="match_scores")
    resume = relationship("Resume", back_populates="match_scores")

class GapReport(Base):
    __tablename__ = "gap_reports"
    id = Column(Integer, primary_key=True, index=True)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    gaps = Column(JSON)
    advisor_plan = Column(JSON)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    job_posting = relationship("JobPosting", back_populates="gap_reports")
    resume = relationship("Resume", back_populates="gap_reports")
