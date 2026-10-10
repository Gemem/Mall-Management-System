import { FastifyInstance } from 'fastify';
import { BillingService } from '../services/billingService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function billingRoutes(fastify: FastifyInstance) {
  fastify.get('/invoices', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as any;
    let tenantId = query.tenantId;

    if (request.user?.role === 'TENANT') {
      tenantId = request.user.tenantId;
    }

    return BillingService.getInvoices({
      tenantId,
      leaseId: query.leaseId,
      status: query.status,
      search: query.search,
    });
  });

  fastify.get('/invoices/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const invoice = await BillingService.getInvoiceById(id);
      if (request.user?.role === 'TENANT' && request.user.tenantId !== invoice.tenantId) {
        return reply.status(403).send({ error: 'Access denied to this billing invoice.' });
      }
      return invoice;
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/invoices/generate-monthly', { preHandler: [authenticate, authorize(['MALL_OWNER', 'ACCOUNTANT'])] }, async (request, reply) => {
    const { year, month } = request.body as { year: number; month: number };
    if (!year || !month) {
      return reply.status(400).send({ error: 'Year and month are required' });
    }

    try {
      const result = await BillingService.generateMonthlyInvoices(Number(year), Number(month));
      await logAuditEvent(request, 'CREATE', 'InvoicesBatch', null, { year, month, count: result.count });
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
