"""
Extraction Schemas and Prompts

Defines structured schemas and LLM prompts for:
- Resume extraction
- Job specification extraction
- Match scoring
- Gap analysis
"""

from typing import Dict, Any

# ============================================================================
# RESUME EXTRACTION SCHEMA & PROMPT
# ============================================================================

RESUME_EXTRACTION_PROMPT = """
You are an expert resume parser. Extract the following structured information from the resume text below.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{{
  "personal_info": {{
    "name": "string",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin_url": "string or null",
    "github_url": "string or null"
  }},
  "professional_summary": "string (2-3 sentences) or null",
  "skills": [
    {{
      "skill": "string",
      "level": "beginner|intermediate|advanced|expert",
      "years_of_experience": "number or null"
    }}
  ],
  "experience": [
    {{
      "company": "string",
      "job_title": "string",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null or 'present'",
      "duration_years": "number or null",
      "location": "string or null",
      "description": "string (key responsibilities and achievements)",
      "technologies_used": ["string"]
    }}
  ],
  "education": [
    {{
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_date": "YYYY or null",
      "end_date": "YYYY or null or 'present'",
      "gpa": "string or null",
      "additional_info": "string or null"
    }}
  ],
  "certifications": [
    {{
      "name": "string",
      "issuer": "string",
      "issue_date": "YYYY-MM or null",
      "expiration_date": "YYYY-MM or null or 'no expiry'",
      "credential_id": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies_used": ["string"],
      "url": "string or null",
      "date": "YYYY-MM or null"
    }}
  ],
  "languages": [
    {{
      "language": "string",
      "proficiency": "beginner|intermediate|advanced|fluent|native"
    }}
  ]
}}

Resume text:
{resume_text}

Remember: Return ONLY the JSON, no other text.
"""

# ============================================================================
# JOB SPECIFICATION EXTRACTION SCHEMA & PROMPT
# ============================================================================

JOB_SPEC_EXTRACTION_PROMPT = """
You are an expert recruiter. Extract the following structured information from the job description below.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{{
  "job_title": "string",
  "company": "string or null",
  "job_type": "full-time|part-time|contract|temporary|internship",
  "seniority_level": "entry|junior|mid|senior|lead|director|executive",
  "location": {{
    "type": "on-site|remote|hybrid",
    "location": "string or null"
  }},
  "description": "string (overall job description)",
  "required_skills": [
    {{
      "skill": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert",
      "years_required": "number or null",
      "is_critical": true
    }}
  ],
  "preferred_skills": [
    {{
      "skill": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert"
    }}
  ],
  "required_education": {{
    "minimum_degree": "high_school|associate|bachelor|master|phd|not_specified",
    "field_of_study": ["string"],
    "minimum_gpa": "number or null"
  }},
  "experience_requirements": {{
    "minimum_years": "number",
    "relevant_fields": ["string"],
    "specific_industries": ["string or null"]
  }},
  "deal_breakers": [
    {{
      "criterion": "string",
      "description": "string",
      "severity": "must_have|preferred"
    }}
  ],
  "compensation": {{
    "salary_min": "number or null",
    "salary_max": "number or null",
    "currency": "USD|EUR|GBP|etc or null",
    "additional_benefits": ["string"]
  }},
  "responsibilities": ["string"],
  "nice_to_have": ["string"]
}}

Job description text:
{job_description}

Remember: Return ONLY the JSON, no other text.
"""

# ============================================================================
# MATCH SCORING PROMPT
# ============================================================================

MATCH_SCORING_PROMPT = """
You are an expert recruiter scoring candidate-job fit. Compare the resume profile against the job specification.

Resume Profile:
{resume_profile}

Job Specification:
{job_spec}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{{
  "overall_score": 0-100 (integer, weighted average),
  "score_breakdown": {{
    "required_skills_match": 0-100,
    "experience_fit": 0-100,
    "education_fit": 0-100,
    "seniority_alignment": 0-100,
    "semantic_relevance": 0-100
  }},
  "weights_used": {{
    "required_skills_match": 0.40,
    "experience_fit": 0.25,
    "education_fit": 0.10,
    "seniority_alignment": 0.15,
    "semantic_relevance": 0.10
  }},
  "required_skills_matched": ["string (skill name)"],
  "required_skills_missing": ["string (skill name)"],
  "experience_gap": {{
    "years_required": "number",
    "years_available": "number",
    "gap_description": "string or null"
  }},
  "education_fit_status": "exceeds_requirements|meets_requirements|partially_meets|below_requirements",
  "deal_breakers_triggered": ["string (deal breaker criterion)"],
  "seniority_fit_level": "overqualified|perfect_fit|slightly_underqualified|significantly_underqualified",
  "summary_rationale": "string (2-3 sentences explaining the match)",
  "top_strengths": ["string (1-3 candidate strengths vs this role)"],
  "areas_for_development": ["string (1-3 gaps or development areas)"]
}}

Remember: Return ONLY the JSON, no other text.
"""

# ============================================================================
# GAP ANALYSIS & ADVISOR PROMPT
# ============================================================================

GAP_ANALYSIS_PROMPT = """
You are an expert career advisor. Analyze the gaps between the candidate's resume and the job requirements.

Resume Profile:
{resume_profile}

Job Specification:
{job_spec}

Match Analysis:
{match_analysis}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{{
  "gaps": [
    {{
      "gap_id": "string (e.g., 'skill_gap_1')",
      "gap_type": "skill|experience|credential|knowledge|tool",
      "title": "string (what is missing)",
      "description": "string (why it matters for this role)",
      "severity": "blocking|important|nice_to_have",
      "current_level": "none|beginner|intermediate|advanced",
      "required_level": "beginner|intermediate|advanced|expert",
      "impact_score": 1-10 (importance)
    }}
  ],
  "advisor_plan": [
    {{
      "gap_id": "string (reference to gap above)",
      "priority_order": 1-10,
      "remediation_actions": [
        {{
          "action_type": "course|certification|project|practice|other",
          "title": "string (specific recommendation)",
          "provider": "string (e.g., Coursera, Udemy, Google, AWS)",
          "estimated_duration": "X weeks or Y hours",
          "cost": "free|paid|varies",
          "url": "string or null",
          "target_level": "intermediate|advanced|expert",
          "estimated_effort_hours": "number or null"
        }}
      ],
      "resume_rewrite_suggestion": "string or null (how to improve resume if this skill is partially present)",
      "success_criteria": "string (how to know the gap is closed)"
    }}
  ],
  "priority_roadmap": [
    {{
      "phase": 1-3,
      "timeline": "string (e.g., 'weeks 1-4')",
      "goals": ["string"],
      "expected_outcome": "string"
    }}
  ],
  "interview_preparation": {{
    "key_topics_to_study": ["string"],
    "common_questions": ["string (potential interview questions)"],
    "suggested_answers_outline": ["string"]
  }}
}}

Remember: Return ONLY the JSON, no other text.
"""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def get_resume_extraction_prompt(resume_text: str) -> str:
    """Get resume extraction prompt with inserted text."""
    return RESUME_EXTRACTION_PROMPT.format(resume_text=resume_text)


def get_job_spec_extraction_prompt(job_description: str) -> str:
    """Get job spec extraction prompt with inserted text."""
    return JOB_SPEC_EXTRACTION_PROMPT.format(job_description=job_description)


def get_match_scoring_prompt(resume_profile: Dict[str, Any], job_spec: Dict[str, Any]) -> str:
    """Get match scoring prompt with inserted data."""
    import json
    return MATCH_SCORING_PROMPT.format(
        resume_profile=json.dumps(resume_profile, indent=2),
        job_spec=json.dumps(job_spec, indent=2)
    )


def get_gap_analysis_prompt(
    resume_profile: Dict[str, Any],
    job_spec: Dict[str, Any],
    match_analysis: Dict[str, Any]
) -> str:
    """Get gap analysis prompt with inserted data."""
    import json
    return GAP_ANALYSIS_PROMPT.format(
        resume_profile=json.dumps(resume_profile, indent=2),
        job_spec=json.dumps(job_spec, indent=2),
        match_analysis=json.dumps(match_analysis, indent=2)
    )
