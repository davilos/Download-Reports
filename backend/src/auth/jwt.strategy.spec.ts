import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtStrategy } from './jwt.strategy';

/**
 * These tests exercise JwtStrategy through its real passport-jwt `authenticate()`
 * entrypoint (extraction + signature/expiration verification + validate()),
 * not just the `validate()` method in isolation — that is the only way to prove
 * the guard actually rejects expired/missing/malformed tokens, since `validate()`
 * only ever receives an already-verified payload.
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const secret = 'test-secret';

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: unknown) => {
      if (key === 'JWT_SECRET') return secret;
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  type AuthResult =
    | { type: 'success'; user: { userId: string } }
    | { type: 'fail'; info: unknown }
    | { type: 'error'; err: unknown };

  function authenticate(token?: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const req = {
        headers: {
          authorization: token !== undefined ? `Bearer ${token}` : undefined,
        },
      };

      (
        strategy as unknown as {
          success: (user: { userId: string }) => void;
          fail: (info: unknown) => void;
          error: (err: unknown) => void;
        }
      ).success = (user) => resolve({ type: 'success', user });
      (strategy as unknown as { fail: (info: unknown) => void }).fail = (
        info,
      ) => resolve({ type: 'fail', info });
      (strategy as unknown as { error: (err: unknown) => void }).error = (
        err,
      ) => resolve({ type: 'error', err });

      (
        strategy as unknown as {
          authenticate: (req: unknown, options?: unknown) => void;
        }
      ).authenticate(req);
    });
  }

  it('accepts a valid token and attaches the userId extracted from the sub claim', async () => {
    const token = jwt.sign({ sub: 'user-123' }, secret, { expiresIn: '1h' });

    const result = await authenticate(token);

    expect(result.type).toBe('success');
    expect(
      (result as { type: 'success'; user: { userId: string } }).user,
    ).toEqual({
      userId: 'user-123',
    });
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign({ sub: 'user-123' }, secret, { expiresIn: -10 });

    const result = await authenticate(token);

    expect(result.type).toBe('fail');
  });

  it('rejects when no token is present', async () => {
    const result = await authenticate(undefined);

    expect(result.type).toBe('fail');
  });

  it('rejects a malformed token', async () => {
    const result = await authenticate('this-is-not-a-jwt');

    expect(result.type).toBe('fail');
  });
});
