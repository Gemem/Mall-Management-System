import { FastifyInstance } from 'fastify';
import { TenantService } from '../services/tenantService.js';
import { authenticate, authorize, enforceTenantIsolation } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function tenantRoutes(fastify: FastifyInstance) {
  fastify.get('/tenants', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'])] }, async (request) => {
    const query = request.query as any;
    return TenantService.getTenants({
      status: query.status,
      search: query.search,
    });
  });

  fastify.get('/tenants/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Strict tenant isolation guard
    enforceTenantIsolation(request, reply, id);
    if (reply.sent) return;

    try {
      return await TenantService.getTenantById(id);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/tenants', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    try {
      const tenant = await TenantService.createTenant(data);
      await logAuditEvent(request, 'CREATE', 'Tenant', tenant.id, data);
      return reply.status(201).send(tenant);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/tenants/:id', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      const updated = await TenantService.updateTenant(id, data);
      await logAuditEvent(request, 'UPDATE', 'Tenant', id, data);
      return updated;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
