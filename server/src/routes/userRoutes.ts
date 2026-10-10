import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function userRoutes(fastify: FastifyInstance) {
  // 1. List all users (Mall Owner and Mall Manager only)
  fastify.get('/users', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        isApproved: true,
        approvedAt: true,
        approvedById: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: [
        { isApproved: 'asc' }, // Pending approval first
        { createdAt: 'desc' },
      ],
    });

    return users;
  });

  // 2. Provision new user directly (Owner / Manager)
  fastify.post('/users', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { email, password, name, role, phone, tenantId, isApproved = true } = request.body as any;

    if (!email || !password || !name || !role) {
      return reply.status(400).send({ error: 'Name, email, password and role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(400).send({ error: 'A user with this email address already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        phone: phone || null,
        tenantId: tenantId || null,
        isApproved: Boolean(isApproved),
        approvedAt: isApproved ? new Date() : null,
        approvedById: isApproved ? request.user!.userId : null,
        isActive: true,
      },
      include: {
        tenant: {
          select: { id: true, name: true, companyName: true },
        },
      },
    });

    await logAuditEvent(request, 'CREATE', 'User', user.id, {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });

    return reply.status(201).send(user);
  });

  // 3. Approve a user (Owner only)
  fastify.patch('/users/:id/approve', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedById: request.user!.userId,
        isActive: true,
      },
      include: {
        tenant: { select: { companyName: true } },
      },
    });

    await logAuditEvent(request, 'STATUS_CHANGE', 'User', id, {
      action: 'APPROVE_USER',
      approvedBy: request.user!.email,
    });

    return updated;
  });

  // 4. Revoke user approval (Owner only)
  fastify.patch('/users/:id/revoke', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (user.role === 'MALL_OWNER' && user.id === request.user!.userId) {
      return reply.status(400).send({ error: 'Cannot revoke permission on your own primary Mall Owner account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isApproved: false,
        approvedAt: null,
      },
      include: {
        tenant: { select: { companyName: true } },
      },
    });

    await logAuditEvent(request, 'STATUS_CHANGE', 'User', id, {
      action: 'REVOKE_USER',
      revokedBy: request.user!.email,
    });

    return updated;
  });

  // 5. Toggle active status (Owner only)
  fastify.patch('/users/:id/status', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isActive } = request.body as { isActive: boolean };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (user.role === 'MALL_OWNER' && user.id === request.user!.userId && !isActive) {
      return reply.status(400).send({ error: 'Cannot deactivate your own primary Mall Owner account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await logAuditEvent(request, 'STATUS_CHANGE', 'User', id, {
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
    });

    return updated;
  });

  // 6. Delete a user (Owner only)
  fastify.delete('/users/:id', { preHandler: [authenticate, authorize(['MALL_OWNER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (user.role === 'MALL_OWNER') {
      return reply.status(400).send({ error: 'Cannot delete primary Mall Owner account' });
    }

    await prisma.user.delete({ where: { id } });

    await logAuditEvent(request, 'DELETE', 'User', id, {
      deletedUser: user.email,
    });

    return { message: 'User removed successfully' };
  });
}
