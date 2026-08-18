-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AtsProvider" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY');

-- CreateEnum
CREATE TYPE "WorkplaceType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'STAFF_PLUS', 'LEAD', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "RoleCategory" AS ENUM ('BACKEND', 'FRONTEND', 'FULLSTACK', 'DEVOPS_SRE_INFRA', 'MOBILE', 'DATA_AI_ML', 'SECURITY', 'ENGINEERING_MANAGEMENT', 'OTHER');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "atsProvider" "AtsProvider" NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalJobId" TEXT NOT NULL,
    "atsProvider" "AtsProvider" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleCategory" "RoleCategory" NOT NULL DEFAULT 'OTHER',
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'UNSPECIFIED',
    "tags" TEXT[],
    "isLatamEligible" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "location" TEXT,
    "workplaceType" "WorkplaceType" NOT NULL DEFAULT 'UNSPECIFIED',
    "allowedLocations" TEXT[],
    "description" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "minSalary" DECIMAL(12,2),
    "maxSalary" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "salarySummary" TEXT,
    "postedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_atsProvider_idx" ON "Company"("slug", "atsProvider");

-- CreateIndex
CREATE INDEX "Job_atsProvider_isActive_idx" ON "Job"("atsProvider", "isActive");

-- CreateIndex
CREATE INDEX "Job_roleCategory_experienceLevel_idx" ON "Job"("roleCategory", "experienceLevel");

-- CreateIndex
CREATE INDEX "Job_tags_idx" ON "Job" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "Job_isLatamEligible_isActive_idx" ON "Job"("isLatamEligible", "isActive");

-- CreateIndex
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt" DESC);

-- CreateIndex
CREATE INDEX "Job_firstSeenAt_idx" ON "Job"("firstSeenAt" DESC);

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "Job"("location");

-- CreateIndex
CREATE INDEX "Job_title_idx" ON "Job"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Job_atsProvider_externalJobId_key" ON "Job"("atsProvider", "externalJobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

