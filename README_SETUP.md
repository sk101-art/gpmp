# AI Resume Analyzer

An end-to-end AI-powered resume analysis and candidate matching system with dual portals for recruiters and applicants. Powered by FastAPI, Next.js, PostgreSQL with pgvector, Ollama (local LLM), Redis, and Docker.

## 🎯 Features

### Recruiter Portal
- Define job specifications with AI-powered extraction
- Rank candidates by semantic similarity + LLM scoring
- View detailed match breakdowns with skill assessments
- See remediation suggestions per candidate

### Applicant Portal
- Upload resume (PDF or DOCX)
- Select target job and get instant gap analysis
- Ranked remediation roadmap (courses, projects, certifications)
- Resume rewrite tips and personalized advice

## 🏗️ Architecture

### Backend Stack
- **FastAPI** — Async API framework for high concurrency
- **PostgreSQL 16** with pgvector — Vector embeddings and semantic search
- **Ollama** — Local LLM inference (Qwen 2.5:7b or Phi 3 Mini)
- **Redis** — Caching and Celery task broker
- **Celery** — Async job processing (resume parsing, extraction, scoring)

### Frontend Stack
- **Next.js 14** — App Router with SSR/SSG
- **Tailwind CSS + shadcn/ui** — Component library and styling
- **React Query** — Server state management

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop)
2. **Ollama** — [Download](https://ollama.ai/)
3. **Node.js 18+** — For frontend development
4. **Python 3.11+** — For backend (if running locally)
5. **Git** — For version control

### Step 1: Pull Ollama Model

Before starting services, download the LLM:

```bash
ollama pull qwen2.5:7b
# OR use the smaller alternative:
# ollama pull phi3:mini
```

**Note:** First pull takes 5-10 minutes (downloads ~4.7GB).

### Step 2: Clone and Setup

```bash
git clone https://github.com/sk101-art/gpmp.git
cd gpmp
```

Copy environment template:
```bash
cp .env.example .env
```

### Step 3: Start Infrastructure (Docker)

Start all background services (PostgreSQL, Redis, Ollama):

```bash
docker-compose up -d
```

Verify all services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS
resume_analyzer_db        Up (health: healthy)
resume_analyzer_redis     Up (health: healthy)
resume_analyzer_ollama    Up
```

### Step 4: Start Backend API

In a new terminal:

```bash
cd gpmp

# Set Python path for Windows
$env:PYTHONPATH = $(Get-Location)

# Start FastAPI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Or on macOS/Linux:
```bash
PYTHONPATH=. python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Step 5: Start Frontend Dev Server

In another new terminal:

```bash
cd gpmp/frontend
npm install
npm run dev
```

## 🌐 Access the Application

Once running, access these URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Recruiter Portal | http://localhost:3000/recruiter | Job posting & candidate ranking |
| Applicant Portal | http://localhost:3000/applicant | Resume upload & gap analysis |
| API Docs | http://localhost:8000/docs | Interactive Swagger API docs |

## 📋 Running Services

### All Running Services

| Service | Port | Purpose |
|---------|------|---------|
| Next.js Frontend | 3000 | User interface (dev mode) |
| FastAPI Backend | 8000 | REST API endpoints |
| PostgreSQL | 5432 | Database with pgvector |
| Redis | 6379 | Caching + Celery broker |
| Ollama | 11434 | Local LLM inference |

## 🧪 Testing the System

### As a Recruiter

1. Navigate to http://localhost:3000/recruiter
2. Go to **Job Spec Builder**
3. Paste a job description:
   ```
   We're hiring a Senior Backend Engineer with 5+ years of Python experience.
   Required: Python, FastAPI, PostgreSQL, Docker, Kubernetes, REST APIs
   Preferred: LLMs, Redis, Microservices
   Education: BS Computer Science
   ```
4. Click **"Create Job Posting"**
5. AI extracts requirements automatically ✨

### As an Applicant

1. Navigate to http://localhost:3000/applicant
2. Upload a resume (PDF or DOCX)
3. Select the job you created
4. Click **"Analyze"**
5. See gap analysis with remediation roadmap ✨

## 🛑 Stopping Services

Stop all Docker containers:
```bash
docker-compose down
```

Kill terminal processes:
- Backend: `Ctrl+C` in the backend terminal
- Frontend: `Ctrl+C` in the frontend terminal

To completely remove data and start fresh:
```bash
docker-compose down -v  # -v removes volumes
```

## 📁 Project Structure

```
gpmp/
├── backend/                    # FastAPI application
│   ├── main.py                # App entry point
│   ├── database.py            # Database configuration
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── routers/               # API routes
│   │   ├── recruiter.py       # Recruiter endpoints
│   │   └── applicant.py       # Applicant endpoints
│   ├── services/              # Business logic
│   │   └── vector_store.py    # Embeddings & search
│   ├── utils/                 # Helper functions
│   │   ├── ai.py              # LLM integration
│   │   ├── auth.py            # Authentication
│   │   ├── parser.py          # Resume parsing
│   │   └── prompts.py         # LLM prompts
│   ├── requirements.txt       # Python dependencies
│   └── worker.py              # Celery worker config
│
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/               # App routes
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── recruiter/     # Recruiter pages
│   │   │   └── applicant/     # Applicant pages
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
│
├── docker-compose.yml         # Docker services
├── .env.example               # Environment template
└── README.md                  # This file
```

## 🔧 Environment Variables

Create `.env` file from `.env.example`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/resume_analyzer

# Redis
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🐛 Troubleshooting

### Docker services won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs db

# Restart services
docker-compose down
docker-compose up -d
```

### Backend API returning 500 errors
```bash
# Check backend logs in terminal where it's running
# Look for database connection issues or missing Ollama model
```

### Frontend can't connect to API
```bash
# Verify backend is running on port 8000
curl http://localhost:8000/docs

# Check NEXT_PUBLIC_API_URL in .env file
# Default should be http://localhost:8000
```

### Ollama model not found
```bash
# Pull the model manually
ollama pull qwen2.5:7b

# Or change model in docker-compose.yml
```

### Port already in use
```bash
# Find and kill process on port
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -i :8000
```

## 📚 API Documentation

Once the backend is running, visit **http://localhost:8000/docs** for interactive Swagger documentation.

Key endpoints:
- `POST /recruiter/jobs` — Create job posting
- `GET /recruiter/jobs` — List jobs
- `POST /recruiter/jobs/{job_id}/rank-candidates` — Rank candidates
- `POST /applicant/resume/upload` — Upload resume
- `GET /applicant/jobs` — List available jobs
- `POST /applicant/gap-analysis` — Analyze gap for resume+job

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 💬 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: sujaykrishna111@gmail.com

---

**Made with ❤️ by sk101-art**
