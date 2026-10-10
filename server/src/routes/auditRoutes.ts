import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/audit-logs', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request) => {
    const query = request.query as any;
    const where: any = {};

    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  });
}
