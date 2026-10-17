import { IsString, IsNotEmpty, IsInt, Min, Max, IsIn } from 'class-validator';
import type { UploadIntentRequest } from '@download-reports/contracts';

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/xml',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export class UploadIntentDto implements UploadIntentRequest {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Min(1)
  @Max(52_428_800)
  fileSize: number;

  @IsIn([...ALLOWED_CONTENT_TYPES])
  contentType: string;
}
