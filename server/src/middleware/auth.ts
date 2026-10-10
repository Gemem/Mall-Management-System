import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload, UserRole } from '../types/index.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header with Bearer token',
      });
    }

    const token = authHeader.substring(7);
    const decoded = await request.server.jwt.verify<JwtPayload>(token);
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
}

export function authorize(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required before authorization check',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Role '${request.user.role}' is not authorized to perform this operation. Allowed: [${allowedRoles.join(', ')}]`,
      });
    }
  };
}

export function enforceTenantIsolation(request: FastifyRequest, reply: FastifyReply, requestedTenantId?: string | null) {
  if (request.user?.role === 'TENANT') {
    if (!request.user.tenantId || (requestedTenantId && request.user.tenantId !== requestedTenantId)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Access denied: Tenant cannot access records belonging to another entity.',
      });
    }
  }
}
