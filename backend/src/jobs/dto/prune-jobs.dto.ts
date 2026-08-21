import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PruneJobsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 45;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  dryRun?: boolean = false;
}

export interface PruneJobsResponse {
  success: boolean;
  message: string;
  data: {
    deactivatedCount: number;
    cutoffDate: string;
    daysThreshold: number;
    dryRun: boolean;
    executionTimeMs: number;
  };
}
