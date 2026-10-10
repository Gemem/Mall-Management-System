import { FastifyInstance } from 'fastify';
import { AnnouncementService } from '../services/announcementService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function announcementRoutes(fastify: FastifyInstance) {
  fastify.get('/announcements', { preHandler: [authenticate] }, async (request) => {
    const user = request.user;
    return AnnouncementService.getAnnouncements({
      tenantId: user?.role === 'TENANT' ? user.tenantId || undefined : undefined,
    });
  });

  fastify.post('/announcements', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const data = request.body as any;
    try {
      const announcement = await AnnouncementService.createAnnouncement({
        ...data,
        authorId: request.user?.userId,
      });

      await logAuditEvent(request, 'CREATE', 'Announcement', announcement.id, { title: data.title });
      return reply.status(201).send(announcement);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/notifications', { preHandler: [authenticate] }, async (request) => {
    return AnnouncementService.getNotifications(request.user!.userId);
  });

  fastify.patch('/notifications/:id/read', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    return AnnouncementService.markNotificationRead(id, request.user!.userId);
  });

  fastify.post('/notifications/read-all', { preHandler: [authenticate] }, async (request) => {
    return AnnouncementService.markAllNotificationsRead(request.user!.userId);
  });
}
