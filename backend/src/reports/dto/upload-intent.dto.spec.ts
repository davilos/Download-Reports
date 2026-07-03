import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UploadIntentDto } from './upload-intent.dto';

describe('UploadIntentDto', () => {
  it('rejects a contentType outside the MIME whitelist (backend 400 INVALID_CONTENT_TYPE)', async () => {
    const dto = plainToInstance(UploadIntentDto, {
      fileName: 'malware.exe',
      fileSize: 1024,
      contentType: 'application/x-msdownload',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'contentType')).toBe(true);
  });

  it('rejects a fileSize over 50MB / 52428800 bytes (backend 400 FILE_TOO_LARGE)', async () => {
    const dto = plainToInstance(UploadIntentDto, {
      fileName: 'huge.pdf',
      fileSize: 52_428_801,
      contentType: 'application/pdf',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'fileSize')).toBe(true);
  });
});
