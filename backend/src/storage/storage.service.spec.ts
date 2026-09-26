import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/presigned-url'),
}));

describe('StorageService', () => {
  let service: StorageService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: unknown) => {
      const config: Record<string, unknown> = {
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        S3_BUCKET_NAME: 'test-bucket',
        UPLOAD_TTL_SECONDS: 900,
        DOWNLOAD_TTL_SECONDS: 120,
      };
      return config[key] ?? defaultVal;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('buildS3Key returns correct path', () => {
    const key = service.buildS3Key('report-123', 'file.pdf');
    expect(key).toBe('reports/report-123/file.pdf');
  });

  it('createPutPresignedUrl returns presigned URL and uses correct TTL', async () => {
    const url = await service.createPutPresignedUrl(
      'reports/id/file.pdf',
      'application/pdf',
      1024,
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(PutObjectCommand),
      { expiresIn: 900 },
    );
    const calledCommand = jest.mocked(getSignedUrl).mock
      .calls[0][1] as PutObjectCommand;
    expect(calledCommand.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'reports/id/file.pdf',
      ContentType: 'application/pdf',
      ContentLength: 1024,
    });
    expect(url).toBe('https://s3.example.com/presigned-url');
  });

  it('createGetPresignedUrl returns presigned URL and uses correct TTL', async () => {
    const url = await service.createGetPresignedUrl('reports/id/file.pdf');
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(GetObjectCommand),
      { expiresIn: 120 },
    );
    const calledCommand = jest.mocked(getSignedUrl).mock
      .calls[0][1] as GetObjectCommand;
    expect(calledCommand.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'reports/id/file.pdf',
    });
    expect(url).toBe('https://s3.example.com/presigned-url');
  });
});
