-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Job_isActive_postedAt_idx" ON "Job"("isActive", "postedAt" DESC);

-- CreateIndex
CREATE INDEX "Job_department_idx" ON "Job"("department");
