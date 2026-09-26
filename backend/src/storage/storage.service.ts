import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly uploadTtl: number;
  private readonly downloadTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
          '',
        ),
      },
    });
    this.bucket = this.configService.get<string>('S3_BUCKET_NAME', '');
    this.uploadTtl = this.configService.get<number>('UPLOAD_TTL_SECONDS', 900);
    this.downloadTtl = this.configService.get<number>(
      'DOWNLOAD_TTL_SECONDS',
      120,
    );
  }

  buildS3Key(reportId: string, fileName: string): string {
    return `reports/${reportId}/${fileName}`;
  }

  async createPutPresignedUrl(
    key: string,
    contentType: string,
    fileSizeBytes: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSizeBytes,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: this.uploadTtl });
  }

  async createGetPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: this.downloadTtl,
    });
  }
}
