import { prisma } from '../db.js';
import { FastifyRequest } from 'fastify';

export async function logAuditEvent(
  request: FastifyRequest,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, any>
) {
  try {
    const userId = request.user?.userId || null;
    const ipAddress = request.ip || (request.headers['x-forwarded-for'] as string) || null;
    const userAgent = request.headers['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Log error but avoid failing main business transaction
    console.error('Failed to log audit event:', err);
  }
}
