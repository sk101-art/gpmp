from typing import List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models import Resume, JobPosting
from backend.utils.ai import get_embedding

class VectorStore:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_resume(self, resume_id: int, text: str):
        embedding = get_embedding(text)
        resume = await self.db.get(Resume, resume_id)
        if resume:
            resume.embedding = embedding
            await self.db.commit()

    async def add_job(self, job_id: int, text: str):
        embedding = get_embedding(text)
        job = await self.db.get(JobPosting, job_id)
        if job:
            job.embedding = embedding
            await self.db.commit()

    async def search_resumes(self, query_embedding: List[float], limit: int = 50):
        # Using pgvector's cosine distance
        query = select(Resume).order_by(Resume.embedding.cosine_distance(query_embedding)).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
