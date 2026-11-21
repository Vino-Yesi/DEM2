import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { resetDemoDatabase } from '@/lib/db';

const originalEnv = {
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  username: process.env.WMS_AUTH_USER,
  password: process.env.WMS_AUTH_PASSWORD,
  origins: process.env.WMS_ALLOWED_ORIGINS,
};

function request(path: string, headers?: Record<string, string>, method = 'GET') {
  return new NextRequest(`https://wms.example.com${path}`, { method, headers });
}

function basicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

afterEach(() => {
  if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnv.nodeEnv;
  if (originalEnv.databaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalEnv.databaseUrl;
  if (originalEnv.username === undefined) delete process.env.WMS_AUTH_USER;
  else process.env.WMS_AUTH_USER = originalEnv.username;
  if (originalEnv.password === undefined) delete process.env.WMS_AUTH_PASSWORD;
  else process.env.WMS_AUTH_PASSWORD = originalEnv.password;
  if (originalEnv.origins === undefined) delete process.env.WMS_ALLOWED_ORIGINS;
  else process.env.WMS_ALLOWED_ORIGINS = originalEnv.origins;
});

describe('WMS deployment security middleware', () => {
  it('fails closed for production builds even when using local storage', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.WMS_AUTH_USER;
    delete process.env.WMS_AUTH_PASSWORD;
    delete process.env.WMS_ALLOWED_ORIGINS;

    const response = await middleware(request('/'));

    expect(response.status).toBe(503);
  });

  it('fails closed when a database deployment has no authentication credentials', async () => {
    process.env.DATABASE_URL = 'postgresql://wms:secret@db.example.com/wms';
    delete process.env.WMS_AUTH_USER;
    delete process.env.WMS_AUTH_PASSWORD;
    delete process.env.WMS_ALLOWED_ORIGINS;

    const response = await middleware(request('/api/wms/state'));

    expect(response.status).toBe(503);
  });

  it('refuses a destructive demo reset in production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(resetDemoDatabase()).rejects.toThrow(/disabled in production/i);
  });

  it('requires valid Basic authentication and adds security headers', async () => {
    const username = 'integration-user';
    const password = 'a-long-test-password-12345';
    process.env.DATABASE_URL = 'postgresql://wms:secret@db.example.com/wms';
    process.env.WMS_AUTH_USER = username;
    process.env.WMS_AUTH_PASSWORD = password;
    delete process.env.WMS_ALLOWED_ORIGINS;

    const denied = await middleware(request('/api/wms/state'));
    expect(denied.status).toBe(401);
    expect(denied.headers.get('www-authenticate')).toContain('Basic');

    const allowed = await middleware(request('/api/wms/state', { authorization: basicAuth(username, password) }));
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('x-content-type-options')).toBe('nosniff');
    expect(allowed.headers.get('x-frame-options')).toBe('DENY');
  });

  it('allows preflight only for exact configured origins and supported headers', async () => {
    process.env.DATABASE_URL = 'postgresql://wms:secret@db.example.com/wms';
    process.env.WMS_AUTH_USER = 'integration-user';
    process.env.WMS_AUTH_PASSWORD = 'a-long-test-password-12345';
    process.env.WMS_ALLOWED_ORIGINS = 'https://erp.example.com';

    const allowed = await middleware(
      request(
        '/api/wms/actions',
        {
          origin: 'https://erp.example.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization,content-type',
        },
        'OPTIONS'
      )
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://erp.example.com');
    expect(allowed.headers.get('access-control-allow-credentials')).toBe('true');

    const denied = await middleware(
      request(
        '/api/wms/actions',
        {
          origin: 'https://attacker.example',
          'access-control-request-method': 'POST',
        },
        'OPTIONS'
      )
    );
    expect(denied.status).toBe(403);
  });
});
