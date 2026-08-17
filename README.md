# DevATS — Software Engineering Job Board & Multi-ATS Ingestion Platform

A high-performance, developer-focused Software Engineering Job Board and Multi-ATS Ingestion Platform built with **NestJS (Fastify engine)**, **Prisma ORM**, **PostgreSQL (with GIN index for tech tags)**, and a **React 19 (Vite) + Tailwind CSS** dual-pane master-detail frontend.

---

## 🌟 Architecture & Key Features

### 1. Multi-ATS Ingestion & Normalization Engine
- **Extensible Adapter Pattern**: Dedicated adapters for 5 public ATS provider endpoints:
  - **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
  - **Lever**: `https://api.lever.co/v0/postings/{slug}?mode=json`
  - **Ashby**: `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`
  - **Workable**: `https://apply.workable.com/api/v1/widget/accounts/{slug}`
  - **SmartRecruiters**: `https://api.smartrecruiters.com/v1/companies/{slug}/postings`
- **Classification Pipeline**:
  - **Role Category Inference**: Auto-classifies into `FRONTEND`, `BACKEND`, `FULLSTACK`, `DEVOPS_SRE_INFRA`, `DATA_AI_ML`, `MOBILE`, `SECURITY`, `ENGINEERING_MANAGEMENT`, or `OTHER` via title regex.
  - **Seniority Inference**: Auto-classifies into `INTERN`, `JUNIOR`, `MID`, `SENIOR`, `STAFF_PLUS`, `LEAD`, or `UNSPECIFIED`.
  - **Tech Stack Auto-Extraction**: Extracts 40+ technologies (`TypeScript`, `React`, `Python`, `Go`, `PostgreSQL`, `AWS`, `Kubernetes`, `Docker`, `GraphQL`, `Rust`, `Next.js`, etc.) using regex word boundaries.
  - **Workplace Inference**: Auto-classifies into `REMOTE`, `HYBRID`, `ONSITE`, or `UNSPECIFIED`.
  - **Idempotency**: Upserts records using composite unique key `(atsProvider, externalJobId)`. Sets `firstSeenAt` on creation and refreshes `lastSeenAt` on subsequent runs.

### 2. RESTful Jobs API (`/api/v1/jobs`)
- **Faceted Query Engine**: Full-text search (title, description, department, company name), role category filter, experience level, tech stack tags (PostgreSQL array via GIN index), workplace type, ATS provider, date window presets (`24h`, `7d`, `30d`), and minimum salary.
- **Dynamic Facets**: Computes active counts for role categories, seniority levels, workplace types, ATS providers, and top tech tags.
- **Fastify & Security**: Running on Fastify with `@fastify/helmet`, `@fastify/cors`, and strict NestJS `ValidationPipe`.

### 3. Frontend Web UI (Dual-Pane Master-Detail)
- **Top Filter & Search Bar**: Debounced search input, segmented role category pills, quick-toggle tech stack chips, and multi-faceted dropdowns.
- **Split-Screen Master-Detail Layout**:
  - **Left Pane (40% width)**: Scrollable job cards with company logo/name, color-coded ATS badge, "NEW" indicator (within 48h), salary badges, and tech stack chips.
  - **Right Pane (60% width)**: Sticky detail viewer with direct "Apply on [ATS]" CTA, share/copy link, metadata breakdown, full tech stack tag pills, and sanitized HTML descriptions rendered safely with `DOMPurify`.
- **Live Ingestion Modal**: Trigger live synchronization for any company slug on Greenhouse, Lever, Ashby, Workable, or SmartRecruiters directly from the UI.

---

## 🚀 Quick Start (Docker Compose)

You can build and spin up the complete full-stack environment (`postgres`, `backend`, and `frontend`) with a single command:

```bash
# Build images and start all 3 containers
docker compose up -d --build
```

### Services & Port Mappings

| Service | Container Name | Local URL / Port | Description |
|---|---|---|---|
| **Frontend** | `jobs_ats_frontend` | `http://127.0.0.1:5173` | React 19 UI with Nginx reverse proxy |
| **Backend** | `jobs_ats_backend` | `http://127.0.0.1:3001` | NestJS Fastify REST API & ATS Crawler |
| **PostgreSQL** | `jobs_ats_postgres` | `127.0.0.1:5435` | Database with GIN-indexed tech tags |

---

## 🛠️ Local Development (Without Full Docker)

### 1. Start PostgreSQL Only
```bash
docker compose up -d postgres
```

### 2. Start Backend (NestJS + Fastify)
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed   # Seed realistic multi-ATS jobs
npm run start:dev     # Starts on http://127.0.0.1:3001
```

### 3. Start Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev           # Starts on http://127.0.0.1:5173
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/jobs` | Query paginated jobs with multi-faceted filters & dynamic facet counts |
| `GET` | `/api/v1/jobs/:idOrSlug` | Retrieve full job details by ID or slug |
| `GET` | `/api/v1/jobs/tags` | Retrieve top tech stack tags with frequency counts |
| `GET` | `/api/v1/ingest/providers` | List supported ATS providers and popular sample slugs |
| `POST` | `/api/v1/ingest/sync` | Ingest public job board by company slug and ATS provider |
| `POST` | `/api/v1/ingest/seed-defaults` | Ingest standard tech company boards (Stripe, OpenAI, Figma, etc.) |
