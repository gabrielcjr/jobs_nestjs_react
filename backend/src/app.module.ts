import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { JobsModule } from './jobs/jobs.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    IngestionModule,
    JobsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
