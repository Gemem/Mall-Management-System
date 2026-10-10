import { FastifyInstance } from 'fastify';
import { ShopService } from '../services/shopService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function shopRoutes(fastify: FastifyInstance) {
  fastify.get('/shops', async (request) => {
    const query = request.query as any;
    return ShopService.getShops({
      floorId: query.floorId,
      sectionId: query.sectionId,
      occupancyStatus: query.occupancyStatus,
      operationalStatus: query.operationalStatus,
      search: query.search,
    });
  });

  fastify.get('/shops/visual-layout', async (request) => {
    const { floorId } = request.query as { floorId?: string };
    return ShopService.getVisualFloorLayout(floorId);
  });

  fastify.get('/shops/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await ShopService.getShopById(id);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/shops', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    try {
      const shop = await ShopService.createShop(data);
      await logAuditEvent(request, 'CREATE', 'Shop', shop.id, data);
      return reply.status(201).send(shop);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/shops/:id', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      const updated = await ShopService.updateShop(id, data);
      await logAuditEvent(request, 'UPDATE', 'Shop', id, data);
      return updated;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/shops/:id', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const deleted = await ShopService.deleteShop(id);
      await logAuditEvent(request, 'DELETE', 'Shop', id);
      return deleted;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/shops/:id/status', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { newStatus, reason, notes } = request.body as any;
    try {
      const result = await ShopService.updateOperationalStatus(id, {
        newStatus,
        reason,
        notes,
        changedById: request.user?.userId,
      });

      await logAuditEvent(request, 'STATUS_CHANGE', 'Shop', id, { newStatus, reason });
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
