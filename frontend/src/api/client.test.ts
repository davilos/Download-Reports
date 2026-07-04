import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock axios so we can inspect the interceptor registered by client.ts,
// while still exercising the real interceptor function it installs.
const { mockUse, mockCreate } = vi.hoisted(() => {
  const mockUse = vi.fn();
  const mockAxiosInstance = {
    interceptors: {
      request: { use: mockUse },
    },
  };
  const mockCreate = vi.fn(() => mockAxiosInstance);
  return { mockUse, mockCreate };
});

vi.mock('axios', () => ({
  default: { create: mockCreate },
}));

describe('apiClient JWT interceptor', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockUse.mockClear();
    mockCreate.mockClear();
    localStorage.clear();
    // Re-import the module under test so it re-registers the interceptor
    // against the mocked axios instance.
    await import('./client');
  });

  function getRegisteredInterceptor(): (config: {
    headers: Record<string, string>;
  }) => { headers: Record<string, string> } {
    expect(mockUse).toHaveBeenCalledTimes(1);
    return mockUse.mock.calls[0][0];
  }

  it('interceptor injects Authorization header when token is present', () => {
    localStorage.setItem('token', 'my-jwt-token');
    const interceptor = getRegisteredInterceptor();

    const result = interceptor({ headers: {} });

    expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('interceptor does not inject Authorization header when token is absent', () => {
    const interceptor = getRegisteredInterceptor();

    const result = interceptor({ headers: {} });

    expect(result.headers.Authorization).toBeUndefined();
  });
});
