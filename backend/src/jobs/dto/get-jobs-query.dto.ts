import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AtsProvider, ExperienceLevel, RoleCategory, WorkplaceType } from '@prisma/client';

export enum DatePostedWindow {
  PAST_24H = '24h',
  PAST_7D = '7d',
  PAST_30D = '30d',
  ALL = 'all',
}

export enum JobSortBy {
  POSTED_AT = 'postedAt',
  FIRST_SEEN_AT = 'firstSeenAt',
  MIN_SALARY = 'minSalary',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetJobsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsEnum(RoleCategory, { each: true })
  roleCategory?: RoleCategory | RoleCategory[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsEnum(ExperienceLevel, { each: true })
  experienceLevel?: ExperienceLevel | ExperienceLevel[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.includes(',') ? value.split(',').map((v) => v.trim()).filter(Boolean) : [value.trim()];
    }
    return [];
  })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsEnum(WorkplaceType, { each: true })
  workplaceType?: WorkplaceType | WorkplaceType[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsEnum(AtsProvider, { each: true })
  atsProvider?: AtsProvider | AtsProvider[];

  @IsOptional()
  @IsEnum(DatePostedWindow)
  datePosted?: DatePostedWindow = DatePostedWindow.ALL;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  latamUsdOnly?: boolean;

  @IsOptional()
  @IsEnum(JobSortBy)
  sortBy?: JobSortBy = JobSortBy.POSTED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  companySlug?: string;
}
