import { FastifyInstance } from 'fastify';
import { LeaseService } from '../services/leaseService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function leaseRoutes(fastify: FastifyInstance) {
  fastify.get('/leases', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as any;
    let tenantId = query.tenantId;

    if (request.user?.role === 'TENANT') {
      tenantId = request.user.tenantId;
    }

    return LeaseService.getLeases({
      tenantId,
      shopId: query.shopId,
      status: query.status,
      search: query.search,
    });
  });

  fastify.get('/leases/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const lease = await LeaseService.getLeaseById(id);
      if (request.user?.role === 'TENANT' && request.user.tenantId !== lease.tenantId) {
        return reply.status(403).send({ error: 'Access denied to this lease record.' });
      }
      return lease;
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/leases', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    try {
      const lease = await LeaseService.createLease(data);
      await logAuditEvent(request, 'CREATE', 'Lease', lease.id, data);
      return reply.status(201).send(lease);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/leases/:id/renew', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      const renewed = await LeaseService.renewLease(id, {
        ...data,
        approvedById: request.user?.userId,
      });
      await logAuditEvent(request, 'RENEW', 'Lease', id, data);
      return renewed;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/leases/:id/terminate', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      const terminated = await LeaseService.terminateLease(id, data);
      await logAuditEvent(request, 'TERMINATE', 'Lease', id, data);
      return terminated;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
