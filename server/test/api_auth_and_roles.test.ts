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

  it('rejects login for an account pending approval, then permits login once approved by Owner', async () => {
    // 1. Register a new user (always pending approval)
    const testEmail = `applicant.${Date.now()}@fashionretail.com`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'SecurePassword123!',
        name: 'Prospective Tenant Rep',
        role: 'TENANT',
      },
    });
    expect(regRes.statusCode).toBe(201);
    const { user: registeredUser } = JSON.parse(regRes.payload);
    expect(registeredUser.isApproved).toBe(false);

    // 2. Attempt login before approval -> Expect 403 Forbidden
    const pendingLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'SecurePassword123!',
      },
    });
    expect(pendingLogin.statusCode).toBe(403);
    const errorBody = JSON.parse(pendingLogin.payload);
    expect(errorBody.error).toMatch(/approval/i);
    expect(errorBody.requiresApproval).toBe(true);

    // 3. Mall Owner signs in
    const ownerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@mall.com',
        password: 'MallAdmin123!',
      },
    });
    const { token: ownerToken } = JSON.parse(ownerLogin.payload);

    // 4. Mall Owner approves the user
    const approveRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${registeredUser.id}/approve`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(approveRes.statusCode).toBe(200);

    // 5. Newly approved user logs in successfully
    const approvedLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'SecurePassword123!',
      },
    });
    expect(approvedLogin.statusCode).toBe(200);
    const loginData = JSON.parse(approvedLogin.payload);
    expect(loginData.token).toBeDefined();
    expect(loginData.user.isApproved).toBe(true);
  });

  it('enforces role-based dashboard privacy: tenants and staff cannot see mall revenue or owner contracts', async () => {
    // 1. Tenant Login
    const tenantLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'tenant@fashionhub.com',
        password: 'Tenant123!',
      },
    });
    const { token: tenantToken } = JSON.parse(tenantLogin.payload);

    // 2. Tenant fetches dashboard
    const tenantDash = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${tenantToken}` },
    });
    expect(tenantDash.statusCode).toBe(200);
    const tenantMetrics = JSON.parse(tenantDash.payload);

    // Must NOT have mall executive metrics or charts
    expect(tenantMetrics.role).toBe('TENANT');
    expect(tenantMetrics.kpis.expectedRent).toBe(0);
    expect(tenantMetrics.kpis.collectedRent).toBe(0);
    expect(tenantMetrics.monthlyTrend).toEqual([]);
    expect(tenantMetrics.expiringLeasesList).toEqual([]);

    // Must have tenant-isolated metrics
    expect(tenantMetrics.myShops).toBeDefined();
    expect(tenantMetrics.myInvoices).toBeDefined();
    expect(tenantMetrics.myTickets).toBeDefined();

    // 3. Owner Login
    const ownerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@mall.com',
        password: 'MallAdmin123!',
      },
    });
    const { token: ownerToken } = JSON.parse(ownerLogin.payload);

    // 4. Owner fetches dashboard
    const ownerDash = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(ownerDash.statusCode).toBe(200);
    const ownerMetrics = JSON.parse(ownerDash.payload);

    // Owner HAS full financial figures and charts
    expect(ownerMetrics.kpis.collectedRent).toBeGreaterThan(0);
    expect(ownerMetrics.monthlyTrend.length).toBeGreaterThan(0);
    expect(ownerMetrics.expiringLeasesList.length).toBeGreaterThan(0);
  });

  it('allows tenant to retrieve only their own payment history and receipts', async () => {
    // 1. Login as Tenant (Elena Rostova - tenant1)
    const tenantLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'tenant@fashionhub.com',
        password: 'Tenant123!',
      },
    });
    const { token, user } = JSON.parse(tenantLogin.payload);

    // 2. Fetch payments list
    const paymentsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/payments',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(paymentsRes.statusCode).toBe(200);
    const payments = JSON.parse(paymentsRes.payload);

    // All payments must belong to this tenant's tenantId
    expect(payments.length).toBeGreaterThan(0);
    for (const p of payments) {
      expect(p.tenantId).toBe(user.tenantId);
      expect(p.receipt).toBeDefined();
    }

    // 3. Fetch receipt for payment
    const receiptRes = await app.inject({
      method: 'GET',
      url: `/api/v1/receipts/${payments[0].id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(receiptRes.statusCode).toBe(200);
    const receipt = JSON.parse(receiptRes.payload);
    expect(receipt.receiptNumber).toBeDefined();
    expect(receipt.payment.tenantId).toBe(user.tenantId);
  });
});


