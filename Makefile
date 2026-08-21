.PHONY: help install dev dev-backend dev-frontend test test-backend test-frontend test-e2e build build-backend build-frontend docker-up docker-down docker-logs docker-db db-push db-seed db-studio clean ci

# Default goal
.DEFAULT_GOAL := help

help: ## Show available make commands
	@echo ""
	@echo "DevATS Project Commands:"
	@echo "----------------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

ci: build test ## Run full CI pipeline verification locally (Builds, Tests, and Schema Validation)
	@echo "🔍 Running Prisma schema & datamodel syntax validation..."
	cd backend && npx prisma validate
	cd backend && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /dev/null
	@echo "✅ All local CI quality gates and backward-compatibility checks passed!"



install: ## Install dependencies for both backend and frontend
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

dev-backend: ## Run NestJS backend in hot-reload dev mode
	cd backend && npm run start:dev

dev-frontend: ## Run React frontend in Vite HMR dev mode
	cd frontend && npm run dev

dev: ## Start PostgreSQL and print instructions for running backend and frontend
	@echo "🚀 Starting PostgreSQL container..."
	docker compose up -d postgres
	@echo "✅ Database is up at localhost:5435."
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals."

test: test-backend test-frontend ## Run all unit, integration, and component tests for backend and frontend

test-backend: ## Run backend unit & integration tests (Jest)
	cd backend && npm run test

test-frontend: ## Run frontend unit & component tests (Vitest)
	cd frontend && npm run test

test-e2e: ## Run Fastify backend E2E tests
	cd backend && npm run test:e2e

test-cov: ## Run backend test coverage
	cd backend && npm run test:cov

build: build-backend build-frontend ## Build production bundles for backend and frontend

build-backend: ## Build NestJS backend bundle
	cd backend && npm run build

build-frontend: ## Build React frontend bundle
	cd frontend && npm run build

docker-up: ## Build and start all services via Docker Compose
	docker compose up -d --build

docker-down: ## Stop and remove Docker Compose containers
	docker compose down

docker-logs: ## View and tail Docker Compose logs
	docker compose logs -f

docker-db: ## Start only PostgreSQL database container
	docker compose up -d postgres

db-push: ## Synchronize Prisma schema directly with PostgreSQL database (prototype mode)
	cd backend && npx prisma db push

db-migrate: ## Create and apply versioned Prisma migration in development
	cd backend && npx prisma migrate dev

db-migrate-deploy: ## Apply pending Prisma migrations in production / CI
	cd backend && npx prisma migrate deploy

db-migrate-status: ## Check status of Prisma migrations
	cd backend && npx prisma migrate status

db-seed: ## Run database seed script
	cd backend && npm run prisma:seed

db-studio: ## Open Prisma Studio database viewer UI
	cd backend && npx prisma studio

clean: ## Clean build artifacts and caches
	rm -rf backend/dist frontend/dist coverage backend/coverage
