import { PrismaClient } from '@prisma/client';
import { isItJob } from '../src/ingestion/utils/tech-classifier.util';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const hardDelete = args.includes('--delete') || args.includes('--hard-delete');

  console.log(`================================================================`);
  console.log(`DevATS Non-IT Job Pruning Tool`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (audit only)' : hardDelete ? 'HARD DELETE (permanent removal)' : 'SOFT DELETE (isActive = false)'}`);
  console.log(`================================================================`);

  const startTime = Date.now();
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    select: { id: true, title: true, department: true, company: { select: { name: true } } },
  });

  console.log(`Total active jobs inspected: ${jobs.length}`);

  const nonItJobs: typeof jobs = [];
  for (const job of jobs) {
    if (!isItJob(job.title, job.department || undefined)) {
      nonItJobs.push(job);
    }
  }

  console.log(`Identified non-IT jobs: ${nonItJobs.length}`);
  console.log(`Preserved legitimate IT jobs: ${jobs.length - nonItJobs.length}`);

  if (nonItJobs.length > 0) {
    console.log(`\nSample of identified non-IT jobs to be ${hardDelete ? 'deleted' : 'deactivated'}:`);
    for (const sample of nonItJobs.slice(0, 15)) {
      console.log(`  - [${sample.company?.name || 'Unknown'}] ${sample.title} (Dept: ${sample.department || 'N/A'})`);
    }
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] No database mutations performed. Duration: ${Date.now() - startTime}ms`);
    return;
  }

  if (nonItJobs.length === 0) {
    console.log(`\nNo non-IT jobs found. Database is already clean!`);
    return;
  }

  const ids = nonItJobs.map((j) => j.id);
  const chunkSize = 500;
  let affected = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    if (hardDelete) {
      const res = await prisma.job.deleteMany({
        where: { id: { in: chunk } },
      });
      affected += res.count;
    } else {
      const res = await prisma.job.updateMany({
        where: { id: { in: chunk } },
        data: { isActive: false },
      });
      affected += res.count;
    }
  }

  console.log(`\nSuccessfully ${hardDelete ? 'deleted' : 'deactivated'} ${affected} non-IT jobs in ${Date.now() - startTime}ms.`);
}

main()
  .catch((err) => {
    console.error('Error during non-IT job pruning:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
