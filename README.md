# DevATS — Software Engineering Job Board & Multi-ATS Ingestion Platform

A high-performance, developer-focused Software Engineering Job Board and Multi-ATS Ingestion Platform built with **NestJS (Fastify engine)**, **Prisma ORM**, **PostgreSQL (with GIN index for tech tags)**, and a **React 19 (Vite) + Tailwind CSS** dual-pane master-detail frontend.

---

## 🌟 Architecture & Key Features

### 1. Automated Multi-ATS Slug Discovery & Ingestion Engine
- **Heuristic Candidate Slug Generator**:
  - Automatically parses company datasets (`global-hiring-companies.csv`) containing 629+ companies.
  - Strips corporate & legal suffixes (`Inc`, `LLC`, `Ltd`, `GmbH`, `Labs`, `Technologies`, `Software`, `Holdings`, etc.).
  - Generates candidate slug variations (known ATS slug, explicit slug, condensed, hyphenated, stripped-condensed, first-word).
- **Multi-ATS Prober**:
  - Concurrently probes **5 public ATS platforms** without requiring API keys:
    - **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
    - **Lever**: `https://api.lever.co/v0/postings/{slug}?mode=json`
    - **Ashby**: `https://api.ashbyhq.com/posting-api/job-board/{slug}`
    - **Workable**: `https://apply.workable.com/api/v1/widget/accounts/{slug}`
    - **SmartRecruiters**: `https://api.smartrecruiters.com/v1/companies/{slug}/postings`
  - Validates live responses (`HTTP 200` + `jobs.length > 0`) and captures the first confirmed live board.
- **Asynchronous Background Processing & Live Progress Streaming**:
  - Probes 600+ companies non-blocking in background workers (`POST /api/v1/ingest/start-csv-discovery`).
  - Real-time progress updates and status polling (`GET /api/v1/ingest/discovery-status`).
- **Classification & Normalization Pipeline**:
  - **Role Category Inference**: Auto-classifies into `FRONTEND`, `BACKEND`, `FULLSTACK`, `DEVOPS_SRE_INFRA`, `DATA_AI_ML`, `MOBILE`, `SECURITY`, `ENGINEERING_MANAGEMENT`, or `OTHER` via title regex.
  - **Seniority Inference**: Auto-classifies into `INTERN`, `JUNIOR`, `MID`, `SENIOR`, `STAFF_PLUS`, `LEAD`, or `UNSPECIFIED`.
  - **Tech Stack Auto-Extraction**: Extracts 40+ technologies (`TypeScript`, `React`, `Python`, `Go`, `PostgreSQL`, `AWS`, `Kubernetes`, `Docker`, `GraphQL`, `Rust`, `Next.js`, `Kafka`, `Tailwind CSS`, `LLM`, etc.) using regex word boundaries.
  - **Workplace Inference**: Auto-classifies into `REMOTE`, `HYBRID`, `ONSITE`, or `UNSPECIFIED`.
  - **100% Idempotency**: Upserts records using composite unique key `(atsProvider, externalJobId)`. Sets `firstSeenAt` on creation and refreshes `lastSeenAt` on subsequent runs without duplication.

---

### 2. RESTful Jobs API (`/api/v1`)
- **Faceted Query Engine (`GET /api/v1/jobs`)**: Full-text search (title, description, department, company name), role category filter, experience level, tech stack tags (PostgreSQL array via GIN index), workplace type, ATS provider, date window presets (`24h`, `7d`, `30d`), and minimum salary.
- **Dynamic Facets**: Computes active counts for role categories, seniority levels, workplace types, ATS providers, and top tech tags.
- **Single Job Detail (`GET /api/v1/jobs/:idOrSlug`)**: Fetches job by ID or SEO slug.
- **Discovery Endpoints**:
  - `POST /api/v1/ingest/start-csv-discovery` — Background discovery across `global-hiring-companies.csv`.
  - `GET /api/v1/ingest/discovery-status` — Poll active background discovery job state.
  - `POST /api/v1/ingest/discover-and-sync` — Probe and sync a single company name.
  - `POST /api/v1/ingest/sync` — Direct sync by slug & ATS provider.
- **Fastify & Security**: Running on Fastify engine with `@fastify/helmet`, `@fastify/cors`, and strict NestJS `ValidationPipe`.

---

### 3. Frontend Web UI (Dual-Pane Master-Detail)
- **Top Filter & Search Bar**: Debounced search input, segmented role category pills, quick-toggle tech stack chips, and multi-faceted dropdowns.
- **Split-Screen Master-Detail Layout**:
  - **Left Pane (40% width)**: Scrollable job cards with stylized gradient `CompanyAvatar`, color-coded ATS badges, "NEW" indicator (within 48h), salary badges, and tech stack chips.
  - **Right Pane (60% width)**: Sticky detail viewer with direct "Apply on [ATS]" CTA, share/copy link, metadata breakdown, full tech stack tag pills, and sanitized HTML descriptions rendered safely with `DOMPurify`.
- **Live Discovery Modal**:
  - 1-click discovery from `backend/global-hiring-companies.csv` with Tier filters (Tier 1, Tier 2, or All 629 companies).
  - Real-time animated progress bar (0% - 100%) and confirmed live board streaming.
  - Single company probe search tab.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | NestJS 11, Fastify, Prisma ORM, TypeScript, Axios, RxJS |
| **Database** | PostgreSQL 16 (with composite indices & GIN index on `tags text[]`) |
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack React Query v5, Lucide React, DOMPurify |
| **Containerization** | Docker, Docker Compose, Multi-stage builds |

---

## 🚀 Getting Started

### Option 1: Docker Compose (Full Stack)

To run the complete system (PostgreSQL + NestJS backend + React frontend) in Docker:

```bash
# Clone the repository
git clone https://github.com/your-username/jobs_nestjs_react.git
cd jobs_nestjs_react

# Start all services
docker compose up -d --build
```

- **Frontend UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5435`

---

### Option 2: Local Development Setup

#### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```

#### 2. Setup & Run Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
Backend runs on `http://127.0.0.1:3001`.

#### 3. Setup & Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://127.0.0.1:5173`.

---

## 📡 Ingesting Jobs

1. Open `http://127.0.0.1:5173` in your browser.
2. Click **"Discover & Ingest ATS Boards"** in the top navigation bar.
3. Choose your discovery mode:
   - **From CSV**: Select your Tier (e.g. *All Tiers - 629 Companies*) and click **"Start Discovery Run"**.
   - **Single Probe**: Type any company name (e.g. `Zapier`, `Stripe`, `MailerLite`, `Datadog`) and click **"Probe ATS"**.
4. The system will probe candidate slugs, verify live endpoints, and index active positions into PostgreSQL.

---

## 📜 License

MIT License. Built for software engineers and engineering teams.
