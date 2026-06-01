import asyncio
from backend.database import AsyncSessionLocal, engine, Base
from backend.models import Company, User, JobPosting
from backend.utils.ai import generate_embedding, extract_job_spec
from sqlalchemy import text

async def seed():
    async with engine.begin() as conn:
        from backend.database import DATABASE_URL
        print(f"SEED DEBUG: Using DATABASE_URL={DATABASE_URL}")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Create a company
        company = Company(name="TechCorp", plan="premium")
        db.add(company)
        await db.flush()

        # Create a recruiter
        recruiter = User(
            company_id=company.id,
            clerk_user_id="user_recruiter_1",
            email="recruiter@techcorp.com",
            role="recruiter"
        )
        db.add(recruiter)

        # Create an applicant
        applicant = User(
            clerk_user_id="user_applicant_1",
            email="applicant@gmail.com",
            role="applicant"
        )
        db.add(applicant)

        # Create a job posting
        job_title = "Senior Frontend Engineer"
        job_desc = """
        We are looking for a Senior Frontend Engineer with experience in React, Next.js, and Tailwind CSS.
        Requirements:
        - 5+ years of experience with JavaScript/TypeScript
        - Strong knowledge of React and its ecosystem
        - Experience with Next.js App Router
        - Mastery of CSS and Tailwind
        - Experience with AI integrations is a plus
        """
        
        # In a real app, this would be extracted via LLM
        # For seeding, we can just use a placeholder or call the util
        print("Extracting job spec...")
        spec = await extract_job_spec(job_desc)
        print("Generating embedding...")
        embedding = await generate_embedding(job_desc)

        job = JobPosting(
            company_id=company.id,
            title=job_title,
            raw_description=job_desc,
            extracted_spec=spec,
            embedding=embedding,
            status="active"
        )
        db.add(job)

        await db.commit()
        print("Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed())
