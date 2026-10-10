import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials or inactive account' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role as any,
        tenantId: user.tenantId,
      },
      { expiresIn: '7d' }
    );

    // Audit log
    await logAuditEvent(request, 'LOGIN', 'User', user.id, { email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatarUrl: user.avatarUrl,
        tenant: user.tenant,
      },
    };
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { tenant: true },
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl,
      tenant: user.tenant,
    };
  });

  fastify.get('/demo-accounts', async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        tenant: {
          select: { companyName: true },
        },
      },
      orderBy: { role: 'asc' },
    });

    return {
      accounts: users.map((u) => ({
        ...u,
        defaultPassword: u.role === 'TENANT' ? 'Tenant123!' : 'MallAdmin123!',
      })),
    };
  });
}
