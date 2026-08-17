import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { AtsProvider } from '@prisma/client';

export class SyncCompanyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Company slug must contain only alphanumeric characters, hyphens, and underscores',
  })
  slug: string;

  @IsEnum(AtsProvider)
  @IsNotEmpty()
  provider: AtsProvider;
}

export class BatchSyncDto {
  companies: SyncCompanyDto[];
}
