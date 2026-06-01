# Quick Start — 5 Minutes

## Prerequisites

- Docker Desktop installed
- Ollama installed (run `ollama pull qwen2.5:7b` first)
- Node.js 18+ (optional, for frontend dev)

## Go

### 1. Start Everything (2 min)

```bash
cd ai-resume-analyzer
cp .env.example .env
docker-compose up -d
```

**Wait for services to initialize:**
```bash
docker-compose ps  # Check all services are UP
```

### 2. Start Frontend (1 min)

```bash
cd frontend
npm install
npm run dev
```

### 3. Visit System (Immediately)

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Recruiter Portal:** http://localhost:3000/recruiter
- **Applicant Portal:** http://localhost:3000/applicant

---

## Test It

### As Recruiter

1. Go to **Recruiter** → **Job Spec Builder**
2. Paste this job description:

```
We're hiring a Senior Backend Engineer with 5+ years of Python experience.
Required: Python, FastAPI, PostgreSQL, Docker, Kubernetes, REST APIs
Preferred: LLMs, Redis, Microservices
Education: BS Computer Science
Responsibilities: Design scalable backend systems, lead technical decisions
```

3. Click **"Create Job Posting"**
4. AI extracts requirements automatically ✨

### As Applicant

1. Go to **Applicant Portal**
2. Upload a resume (PDF or DOCX)
3. Select the job you just created
4. Click **"Analyze"**
5. See your gap analysis with remediation roadmap ✨

---

## What's Running?

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | User interface |
| Backend API | 8000 | REST endpoints |
| PostgreSQL | 5432 | Data storage (pgvector) |
| Redis | 6379 | Caching + Celery broker |
| Ollama | 11434 | Local LLM inference |

---

## Stop Everything

```bash
docker-compose down
```

---

## Troubleshooting

**Services not starting?**
```bash
docker-compose logs backend  # Check logs
docker-compose down && docker-compose up -d  # Restart
```

**API endpoint returns error?**
```bash
# Check if backend is healthy
curl http://localhost:8000/docs
```

**Ollama not responding?**
```bash
# Verify model is loaded
ollama list

# Re-pull if needed
ollama pull qwen2.5:7b
```

---

## Next Steps

- Read `README.md` for full documentation
- Read `TESTING.md` for comprehensive test scenarios
- Read `IMPLEMENTATION_SUMMARY.md` for architecture details
- Explore API at http://localhost:8000/docs

**Enjoy! 🚀**
