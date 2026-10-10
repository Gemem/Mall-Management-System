import { FastifyInstance } from 'fastify';
import { MallService } from '../services/mallService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function mallRoutes(fastify: FastifyInstance) {
  fastify.get('/mall', async () => {
    return MallService.getMallDetails();
  });

  fastify.patch('/mall/:id', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updated = await MallService.updateMallDetails(id, data);
    await logAuditEvent(request, 'UPDATE', 'Mall', id, data);
    return updated;
  });

  fastify.get('/floors', async () => {
    return MallService.getFloors();
  });

  fastify.post('/floors', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    const floor = await MallService.createFloor(data);
    await logAuditEvent(request, 'CREATE', 'Floor', floor.id, data);
    return reply.status(201).send(floor);
  });

  fastify.patch('/floors/:id', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updated = await MallService.updateFloor(id, data);
    await logAuditEvent(request, 'UPDATE', 'Floor', id, data);
    return updated;
  });

  fastify.delete('/floors/:id', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const deleted = await MallService.deleteFloor(id);
      await logAuditEvent(request, 'DELETE', 'Floor', id);
      return deleted;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/sections', async (request) => {
    const { floorId } = request.query as { floorId?: string };
    return MallService.getSections(floorId);
  });

  fastify.post('/sections', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    const section = await MallService.createSection(data);
    await logAuditEvent(request, 'CREATE', 'Section', section.id, data);
    return reply.status(201).send(section);
  });
}
