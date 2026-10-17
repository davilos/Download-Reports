import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import type { ReportsFilters, ReportType } from '@download-reports/contracts';

export class ReportsFiltersDto implements ReportsFilters {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['pdf', 'xml', 'csv', 'xlsx', 'all'])
  type?: ReportType | 'all';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number;
}
