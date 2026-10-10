import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

describe('API Authorization and Security Boundaries', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  it('rejects unauthenticated requests to protected endpoints', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('authenticates valid credentials and issues JWT token', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@mall.com',
        password: 'MallAdmin123!',
      },
    });

    expect(loginRes.statusCode).toBe(200);
    const body = JSON.parse(loginRes.payload);
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe('MALL_OWNER');
  });

  it('prohibits tenant from accessing mall owner settings or all tenant records', async () => {
    // 1. Login as Tenant
    const tenantLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'tenant@fashionhub.com',
        password: 'Tenant123!',
      },
    });
    const { token } = JSON.parse(tenantLogin.payload);

    // 2. Tenant tries to get all tenants list (Staff only)
    const tenantsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/tenants',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantsRes.statusCode).toBe(403);
  });
});
