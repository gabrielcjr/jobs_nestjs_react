import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [PrismaModule, IngestionModule, JobsModule],
})
export class AppModule {}
