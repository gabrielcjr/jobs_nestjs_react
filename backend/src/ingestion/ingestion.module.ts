import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { AtsDiscoveryService } from './services/ats-discovery.service';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';

@Module({
  controllers: [IngestionController],
  providers: [
    IngestionService,
    AtsDiscoveryService,
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
  ],
  exports: [IngestionService, AtsDiscoveryService],
})
export class IngestionModule {}
