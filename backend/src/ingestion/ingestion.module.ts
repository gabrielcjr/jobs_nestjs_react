import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { AtsDiscoveryService } from './services/ats-discovery.service';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { WorkableAdapter } from './adapters/workable.adapter';
import { SmartRecruitersAdapter } from './adapters/smartrecruiters.adapter';

@Module({
  controllers: [IngestionController],
  providers: [
    IngestionService,
    AtsDiscoveryService,
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
    WorkableAdapter,
    SmartRecruitersAdapter,
  ],
  exports: [IngestionService, AtsDiscoveryService],
})
export class IngestionModule {}
