# Testing Guide — AI Resume Analyzer V1

End-to-end testing scenarios with real API requests and expected outputs.

## Pre-Test Setup

1. **Ensure all services running:**
   ```bash
   docker-compose ps
   ```

2. **Check Ollama is ready:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. **Access API docs:**
   ```
   http://localhost:8000/docs  (Swagger UI)
   ```

4. **Test PostgreSQL connection:**
   ```bash
   docker exec resume_analyzer_db psql -U user -d resume_analyzer -c "SELECT 1;"
   ```

---

## Scenario 1: Recruiter Creates Job & Ranks Candidates

### Step 1: Create a Job Posting

**Endpoint:** `POST /recruiter/jobs`

**Request (cURL):**
```bash
curl -X POST http://localhost:8000/recruiter/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "title": "Senior Backend Engineer",
    "description": "We are looking for a Senior Backend Engineer to join our team. Required: 5+ years Python experience, async programming with FastAPI or similar, PostgreSQL optimization, Docker/Kubernetes, REST API design. Preferred: Experience with LLMs, Redis, message queues. Education: BS Computer Science or equivalent. Must have: Strong communication skills.",
    "company_id": 1
  }'
```

**Expected Response (202 or 200):**
```json
{
  "id": 1,
  "title": "Senior Backend Engineer",
  "company_id": 1,
  "status": "active",
  "extracted_spec": {
    "job_title": "Senior Backend Engineer",
    "required_skills": [
      {"skill": "Python", "proficiency_level": "advanced", "years_required": 5},
      {"skill": "FastAPI", "proficiency_level": "advanced", "years_required": 3},
      {"skill": "PostgreSQL", "proficiency_level": "advanced"},
      {"skill": "Docker", "proficiency_level": "intermediate"},
      {"skill": "Kubernetes", "proficiency_level": "intermediate"}
    ],
    "preferred_skills": [
      {"skill": "LLMs"},
      {"skill": "Redis"},
      {"skill": "Message Queues"}
    ],
    "required_education": {
      "minimum_degree": "bachelor",
      "field_of_study": ["Computer Science"]
    },
    "experience_requirements": {
      "minimum_years": 5,
      "relevant_fields": ["Backend Development", "Software Engineering"]
    }
  },
  "created_at": "2024-05-05T10:15:30"
}
```

### Step 2: Upload Test Resumes (as Applicant)

**Endpoint:** `POST /applicant/resume/upload`

Create a simple test resume file (or use existing PDFs):

```bash
curl -X POST http://localhost:8000/applicant/resume/upload \
  -H "Authorization: Bearer test-token" \
  -F "user_id=1" \
  -F "file=@/path/to/resume.pdf"
```

**Expected Response:**
```json
{
  "resume_id": 1,
  "user_id": 1,
  "filename": "resume.pdf",
  "status": "processed",
  "quality_score": 85,
  "extracted_profile": {
    "personal_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-123-4567",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    },
    "professional_summary": "Backend engineer with 6 years experience...",
    "skills": [
      {"skill": "Python", "level": "expert", "years_of_experience": 6},
      {"skill": "FastAPI", "level": "advanced", "years_of_experience": 3},
      {"skill": "PostgreSQL", "level": "advanced", "years_of_experience": 4},
      {"skill": "Docker", "level": "intermediate", "years_of_experience": 2}
    ],
    "experience": [
      {
        "company": "TechCorp Inc",
        "job_title": "Senior Backend Engineer",
        "start_date": "2021-01",
        "end_date": "present",
        "duration_years": 3,
        "description": "Led development of microservices architecture...",
        "technologies_used": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]
      }
    ],
    "education": [
      {
        "institution": "State University",
        "degree": "Bachelor of Science",
        "field_of_study": "Computer Science",
        "end_date": "2018"
      }
    ]
  },
  "created_at": "2024-05-05T10:16:45"
}
```

**Note:** Upload multiple resumes with varying profiles (junior, mid, senior levels) for realistic ranking.

### Step 3: Rank Candidates for Job

**Endpoint:** `POST /recruiter/jobs/{job_id}/rank-candidates`

```bash
curl -X POST http://localhost:8000/recruiter/jobs/1/rank-candidates \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**
```json
{
  "message": "Candidates ranked successfully",
  "job_id": 1,
  "candidates_ranked": 3,
  "total_candidates": 3
}
```

**Note:** This triggers background processing. Wait 1–2 minutes for completion.

### Step 4: View Ranked Candidates

**Endpoint:** `GET /recruiter/jobs/{job_id}/candidates`

```bash
curl -X GET http://localhost:8000/recruiter/jobs/1/candidates \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**
```json
{
  "job_id": 1,
  "job_title": "Senior Backend Engineer",
  "total_candidates": 3,
  "candidates": [
    {
      "resume_id": 1,
      "user_id": 1,
      "overall_score": 92,
      "score_breakdown": {
        "required_skills_match": 95,
        "experience_fit": 90,
        "education_fit": 100,
        "seniority_alignment": 90,
        "semantic_relevance": 85
      },
      "rationale": "Strong match with 6 years of Python experience and proven FastAPI expertise. Meets all core requirements with excellent technical depth.",
      "profile": {
        "personal_info": {...},
        "skills": [...],
        "experience": [...]
      },
      "scored_at": "2024-05-05T10:18:30"
    },
    {
      "resume_id": 2,
      "overall_score": 78,
      "rationale": "Good fit with 4 years of backend experience. Missing Kubernetes exposure but has Docker knowledge.",
      "scored_at": "2024-05-05T10:19:15"
    }
  ]
}
```

---

## Scenario 2: Applicant Gets Gap Analysis

### Step 1: Applicant Uploads Resume

(See Scenario 1, Step 2)

### Step 2: Applicant Analyzes Gap Against Job

**Endpoint:** `POST /applicant/gap-analysis`

```bash
curl -X POST http://localhost:8000/applicant/gap-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "resume_id": 2,
    "job_id": 1
  }'
```

**Expected Response:**
```json
{
  "resume_id": 2,
  "job_id": 1,
  "match_score": 78,
  "match_breakdown": {
    "required_skills_match": 80,
    "experience_fit": 75,
    "education_fit": 95,
    "seniority_alignment": 80,
    "semantic_relevance": 70
  },
  "required_skills_matched": ["Python", "FastAPI", "PostgreSQL", "Docker"],
  "required_skills_missing": ["Kubernetes"],
  "gaps": [
    {
      "gap_id": "skill_gap_1",
      "gap_type": "skill",
      "title": "Kubernetes",
      "description": "Missing hands-on Kubernetes experience. This is critical for the role's infrastructure responsibilities.",
      "severity": "important",
      "current_level": "none",
      "required_level": "intermediate",
      "impact_score": 8
    },
    {
      "gap_id": "skill_gap_2",
      "gap_type": "skill",
      "title": "Redis Advanced Patterns",
      "description": "Resume mentions Redis basics, but lacks advanced caching patterns and distributed session management.",
      "severity": "nice_to_have",
      "current_level": "beginner",
      "required_level": "intermediate",
      "impact_score": 5
    }
  ],
  "advisor_plan": [
    {
      "gap_id": "skill_gap_1",
      "priority_order": 1,
      "remediation_actions": [
        {
          "action_type": "certification",
          "title": "Certified Kubernetes Administrator (CKA)",
          "provider": "Linux Foundation",
          "estimated_duration": "8 weeks",
          "cost": "paid",
          "url": "https://www.linuxfoundation.org/cka",
          "target_level": "intermediate",
          "estimated_effort_hours": 120
        },
        {
          "action_type": "course",
          "title": "Kubernetes for Developers on Google Cloud",
          "provider": "Google Cloud Skills Boost",
          "estimated_duration": "2 weeks",
          "cost": "free",
          "url": "https://www.cloudskillsboost.google/",
          "target_level": "intermediate",
          "estimated_effort_hours": 20
        },
        {
          "action_type": "project",
          "title": "Deploy a multi-service microservices app on GKE or EKS",
          "provider": "Self-directed",
          "estimated_duration": "3 weeks",
          "cost": "varies",
          "target_level": "intermediate",
          "estimated_effort_hours": 40
        }
      ],
      "resume_rewrite_suggestion": null,
      "success_criteria": "Deploy and manage a 3+ service app on Kubernetes with auto-scaling and health checks configured."
    }
  ],
  "priority_roadmap": [
    {
      "phase": 1,
      "timeline": "weeks 1-2",
      "goals": ["Start Google Cloud Kubernetes course", "Set up personal GKE cluster"],
      "expected_outcome": "Understand K8s concepts and basic deployment"
    },
    {
      "phase": 2,
      "timeline": "weeks 3-6",
      "goals": ["Complete personal project: deploy microservices to K8s", "Take CKA exam prep course"],
      "expected_outcome": "Hands-on experience with real Kubernetes operations"
    },
    {
      "phase": 3,
      "timeline": "weeks 7-8",
      "goals": ["Pass CKA exam", "Update resume with K8s experience"],
      "expected_outcome": "Ready to re-apply with certified Kubernetes expertise"
    }
  ],
  "interview_preparation": {
    "key_topics_to_study": [
      "Kubernetes architecture (master, nodes, pods, services)",
      "Deployment strategies (rolling, canary, blue-green)",
      "Persistent volumes and storage classes",
      "Network policies and service mesh"
    ],
    "common_questions": [
      "Describe your experience deploying applications to Kubernetes",
      "How would you debug a pod that keeps crashing?",
      "Explain the difference between a Deployment and a StatefulSet"
    ],
    "suggested_answers_outline": [
      "Mention any cloud platforms (AWS EKS, GCP GKE, Azure AKS)",
      "Walk through troubleshooting steps: logs, events, resource limits",
      "Explain use cases: Deployments for stateless apps, StatefulSets for databases"
    ]
  },
  "generated_at": "2024-05-05T10:22:15"
}
```

---

## Scenario 3: Testing Edge Cases

### Test 3A: Resume with Poor Quality

Create a short, minimal resume or corrupt PDF.

**Expected:** Quality score < 50, extraction has `"extraction_error"` field

### Test 3B: Job with Vague Description

```bash
curl -X POST http://localhost:8000/recruiter/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Developer",
    "description": "Looking for a developer. Email us if interested.",
    "company_id": 1
  }'
```

**Expected:** Job created, but `extracted_spec` will be sparse. Test resilience.

### Test 3C: Ranking with No Resumes

Create job, then immediately rank without uploading resumes.

**Expected:** Response: `"candidates_ranked": 0`

### Test 3D: Cache Hit Test

1. Score a candidate for a job
2. Wait 5 seconds
3. Score again
4. Check logs: should see `"Cache hit"` message

---

## Performance Checklist

| Metric | Expected | Command |
|--------|----------|---------|
| Resume upload | < 10s | `time curl -F "file=@resume.pdf" ...` |
| Resume extraction | < 8s | Check logs for duration |
| Job ranking (50 resumes) | < 3 min | Monitor Celery worker |
| Gap analysis | < 10s | Check response time |
| Semantic search | < 1s | Check SQL query logs |

---

## Debugging

### Check Backend Logs
```bash
docker logs resume_analyzer_backend --tail=50 -f
```

### Check Worker Logs
```bash
docker logs resume_analyzer_worker --tail=50 -f
```

### Check Database
```bash
docker exec resume_analyzer_db psql -U user -d resume_analyzer -c "SELECT COUNT(*) FROM resumes;"
```

### Check Redis Cache
```bash
docker exec resume_analyzer_redis redis-cli KEYS "match:*"
```

### Test Ollama
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:7b",
    "prompt": "What is 2+2?",
    "stream": false
  }'
```

---

## Success Criteria

✅ All Services Running
```bash
docker-compose ps | grep Up
```

✅ API Responds
```bash
curl http://localhost:8000/docs
```

✅ Database Connected
```bash
curl http://localhost:8000/recruiter/jobs
```

✅ Ollama Accessible
```bash
curl http://localhost:11434/api/tags
```

✅ Job Creation Works
```bash
POST /recruiter/jobs → status 200
```

✅ Resume Upload Works
```bash
POST /applicant/resume/upload → resume_id returned
```

✅ Gap Analysis Generates
```bash
POST /applicant/gap-analysis → gaps array populated
```

✅ Ranking Completes
```bash
GET /recruiter/jobs/{id}/candidates → sorted by overall_score
```

✅ Caching Active
```bash
Check logs for "Cache hit" messages
```

---

## Manual UI Testing

### Recruiter Portal
1. Visit `http://localhost:3000/recruiter`
2. Create job → See AI-extracted spec
3. Upload test resume file (applicant side)
4. Rank candidates → Wait 2 min
5. View ranked list → Verify scores
6. Click candidate → See details

### Applicant Portal
1. Visit `http://localhost:3000/applicant`
2. Upload resume → See quality score
3. Select job → Analyze
4. Review gaps → See remediation plan
5. Click course links (mock validation)
6. Update resume → Re-analyze

---

## Known Limitations (V1)

- **Auth:** Simplified role-based (no actual OAuth)
- **Storage:** Local Docker volumes (no S3 integration)
- **LLM:** CPU-only inference (GPU ~10x faster)
- **Cache:** In-memory Redis (no distributed cache)
- **Monitoring:** Basic logging (no structured observability)

These will be addressed in V2.
