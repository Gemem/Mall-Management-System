import { FastifyInstance } from 'fastify';
import { MaintenanceService } from '../services/maintenanceService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function maintenanceRoutes(fastify: FastifyInstance) {
  fastify.get('/maintenance', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as any;
    let tenantId = query.tenantId;

    if (request.user?.role === 'TENANT') {
      tenantId = request.user.tenantId;
    }

    return MaintenanceService.getTickets({
      shopId: query.shopId,
      tenantId,
      status: query.status,
      priority: query.priority,
      category: query.category,
      search: query.search,
    });
  });

  fastify.get('/maintenance/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isStaff = request.user?.role !== 'TENANT';

    try {
      const ticket = await MaintenanceService.getTicketById(id, isStaff);
      if (request.user?.role === 'TENANT' && ticket.tenantId && ticket.tenantId !== request.user.tenantId) {
        return reply.status(403).send({ error: 'Access denied to this maintenance ticket.' });
      }
      return ticket;
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/maintenance', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = request.user?.role === 'TENANT' ? request.user.tenantId || undefined : data.tenantId;

    try {
      const ticket = await MaintenanceService.createTicket({
        shopId: data.shopId,
        tenantId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        assignedToId: request.user?.role !== 'TENANT' ? data.assignedToId : undefined,
      });

      await logAuditEvent(request, 'CREATE', 'MaintenanceTicket', ticket.id, { title: data.title });
      return reply.status(201).send(ticket);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/maintenance/:id', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    try {
      const updated = await MaintenanceService.updateTicketStatus(id, data);
      await logAuditEvent(request, 'UPDATE', 'MaintenanceTicket', id, data);
      return updated;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/maintenance/:id/comments', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { message, isInternal } = request.body as any;

    // Tenants cannot post internal notes
    const actualIsInternal = request.user?.role === 'TENANT' ? false : (isInternal ?? false);

    try {
      const comment = await MaintenanceService.addComment({
        ticketId: id,
        userId: request.user!.userId,
        message,
        isInternal: actualIsInternal,
      });

      return reply.status(201).send(comment);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
