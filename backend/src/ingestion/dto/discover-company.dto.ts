import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DiscoverCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class DiscoverBatchDto {
  @IsArray()
  @IsNotEmpty()
  companies: string[];
}
