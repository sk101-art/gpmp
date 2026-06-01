"""
AI Engine Module

Handles:
- LLM calls via Ollama (Qwen 2.5:7b or Phi 3 Mini)
- Structured extraction (resume, job spec)
- Embedding generation
- Match scoring
- Gap analysis
"""

import ollama
import json
import os
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from backend.utils.prompts import (
    get_resume_extraction_prompt,
    get_job_spec_extraction_prompt,
    get_match_scoring_prompt,
    get_gap_analysis_prompt,
)

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

# Fallback to Phi 3 Mini if primary model unavailable
FALLBACK_MODEL = "phi3:mini"

# Embedding model for vector storage (use a smaller embedder if available)
EMBEDDING_MODEL = "nomic-embed-text"  # 768 dimensions, smaller and faster

# Temperature settings for different tasks
TEMP_EXTRACTION = 0.3  # Low for consistent extraction
TEMP_SCORING = 0.5    # Medium for nuanced scoring
TEMP_ADVICE = 0.6     # Slightly higher for creative advice


def get_ollama_client():
    """Get Ollama client instance."""
    try:
        return ollama.Client(host=OLLAMA_HOST)
    except Exception as e:
        logger.error(f"Failed to connect to Ollama at {OLLAMA_HOST}: {str(e)}")
        raise


def _call_ollama(
    prompt: str,
    model: str = OLLAMA_MODEL,
    temperature: float = 0.5,
    format: str = "json",
    timeout: int = 120,
) -> str:
    """
    Call Ollama with error handling and retries.
    Returns raw response text.
    """
    client = get_ollama_client()
    
    try:
        logger.info(f"Calling Ollama model: {model}")
        response = client.generate(
            model=model,
            prompt=prompt,
            format=format,
            temperature=temperature,
            stream=False,
        )
        return response.get("response", "").strip()
    except Exception as e:
        logger.warning(f"Error with model {model}: {str(e)}, trying fallback")
        try:
            response = client.generate(
                model=FALLBACK_MODEL,
                prompt=prompt,
                format=format,
                temperature=temperature,
                stream=False,
            )
            return response.get("response", "").strip()
        except Exception as e2:
            logger.error(f"Both models failed: {str(e2)}")
            raise


def _extract_json_from_response(response: str) -> Dict[str, Any]:
    """
    Extract JSON from LLM response.
    Handles cases where LLM returns markdown code blocks.
    """
    # Try direct parsing first
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code blocks
    import re
    json_pattern = r"```(?:json)?\s*(\{[\s\S]*?\})\s*```"
    match = re.search(json_pattern, response)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find first { and last }
    start = response.find("{")
    end = response.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(response[start:end+1])
        except json.JSONDecodeError:
            pass
    
    logger.error(f"Failed to extract JSON from response: {response[:200]}")
    raise ValueError("Failed to parse LLM response as JSON")


async def extract_resume_profile(raw_text: str) -> Dict[str, Any]:
    """
    Extract structured resume profile from raw text.
    
    Returns resume JSON with sections:
    - personal_info
    - professional_summary
    - skills
    - experience
    - education
    - certifications
    - projects
    - languages
    """
    prompt = get_resume_extraction_prompt(raw_text)
    
    try:
        response = _call_ollama(
            prompt=prompt,
            model=OLLAMA_MODEL,
            temperature=TEMP_EXTRACTION,
        )
        return _extract_json_from_response(response)
    except Exception as e:
        logger.error(f"Resume extraction failed: {str(e)}")
        # Return minimal valid structure on failure
        return {
            "personal_info": {},
            "professional_summary": None,
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "languages": [],
            "extraction_error": str(e),
        }


async def extract_job_spec(raw_description: str) -> Dict[str, Any]:
    """
    Extract structured job specification from raw description.
    
    Returns job spec JSON with sections:
    - job_title
    - required_skills
    - preferred_skills
    - required_education
    - experience_requirements
    - deal_breakers
    - compensation
    - responsibilities
    """
    prompt = get_job_spec_extraction_prompt(raw_description)
    
    try:
        response = _call_ollama(
            prompt=prompt,
            model=OLLAMA_MODEL,
            temperature=TEMP_EXTRACTION,
        )
        return _extract_json_from_response(response)
    except Exception as e:
        logger.error(f"Job spec extraction failed: {str(e)}")
        return {
            "job_title": "Unknown",
            "required_skills": [],
            "preferred_skills": [],
            "required_education": {},
            "experience_requirements": {},
            "deal_breakers": [],
            "responsibilities": [],
            "extraction_error": str(e),
        }


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding vector for text.
    Uses smaller local model for speed.
    Falls back to zero vector on error.
    """
    try:
        client = get_ollama_client()
        response = client.embeddings(model=EMBEDDING_MODEL, prompt=text)
        embedding = response.get("embedding", [])
        
        # Ensure we always return 768 dimensions (nomic-embed-text)
        if len(embedding) == 768:
            return embedding
        # Pad or truncate to 768 if needed
        return (embedding + [0.0] * 768)[:768]
    except Exception as e:
        logger.warning(f"Embedding generation failed: {str(e)}, returning zero vector")
        return [0.0] * 768


async def generate_match_score(
    resume_profile: Dict[str, Any],
    job_spec: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate match score between resume and job spec.
    
    Uses 2-stage approach:
    1. Parse resume and job spec
    2. Use LLM to score match with weighted criteria
    
    Returns match data with:
    - overall_score (0-100)
    - score_breakdown
    - required_skills_matched
    - required_skills_missing
    - experience_gap
    - deal_breakers_triggered
    - summary_rationale
    """
    prompt = get_match_scoring_prompt(resume_profile, job_spec)
    
    try:
        response = _call_ollama(
            prompt=prompt,
            model=OLLAMA_MODEL,
            temperature=TEMP_SCORING,
        )
        return _extract_json_from_response(response)
    except Exception as e:
        logger.error(f"Match scoring failed: {str(e)}")
        return {
            "overall_score": 0,
            "score_breakdown": {},
            "required_skills_matched": [],
            "required_skills_missing": [],
            "deal_breakers_triggered": [],
            "summary_rationale": "Scoring failed",
            "scoring_error": str(e),
        }


async def generate_gap_analysis(
    resume_profile: Dict[str, Any],
    job_spec: Dict[str, Any],
    match_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate gap analysis and remediation advice.
    
    Returns advisor data with:
    - gaps (array of identified gaps)
    - advisor_plan (ranked remediation steps)
    - priority_roadmap (phased approach)
    - interview_preparation
    """
    prompt = get_gap_analysis_prompt(resume_profile, job_spec, match_analysis)
    
    try:
        response = _call_ollama(
            prompt=prompt,
            model=OLLAMA_MODEL,
            temperature=TEMP_ADVICE,
        )
        return _extract_json_from_response(response)
    except Exception as e:
        logger.error(f"Gap analysis failed: {str(e)}")
        return {
            "gaps": [],
            "advisor_plan": [],
            "priority_roadmap": [],
            "interview_preparation": {},
            "analysis_error": str(e),
        }


async def semantic_search(
    db: AsyncSession,
    query_embedding: List[float],
    limit: int = 50,
) -> List[Any]:
    """
    Semantic search using pgvector cosine similarity.
    
    Finds top-N resumes most similar to query embedding.
    """
    try:
        from backend.models import Resume
        
        # Use pgvector cosine distance
        query = select(Resume).order_by(
            Resume.embedding.cosine_distance(query_embedding)
        ).limit(limit)
        
        result = await db.execute(query)
        resumes = result.scalars().all()
        logger.info(f"Semantic search found {len(resumes)} resumes")
        return resumes
    except Exception as e:
        logger.error(f"Semantic search failed: {str(e)}")
        return []


async def get_or_create_embedding_index(db: AsyncSession) -> bool:
    """
    Create HNSW index for efficient ANN search if not exists.
    """
    try:
        await db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_resumes_embedding ON resumes "
            "USING hnsw (embedding vector_cosine_ops)"
        ))
        await db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON job_postings "
            "USING hnsw (embedding vector_cosine_ops)"
        ))
        await db.commit()
        logger.info("Embedding indexes created or already exist")
        return True
    except Exception as e:
        logger.warning(f"Index creation warning: {str(e)}")
        return False

