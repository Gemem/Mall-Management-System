import { FastifyInstance } from 'fastify';
import { DocumentService } from '../services/documentService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.get('/documents', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as any;
    let tenantId = query.tenantId;

    if (request.user?.role === 'TENANT') {
      tenantId = request.user.tenantId;
    }

    return DocumentService.getDocuments({
      tenantId,
      shopId: query.shopId,
      leaseId: query.leaseId,
      documentType: query.documentType,
      search: query.search,
    });
  });

  fastify.get('/documents/expiring', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request) => {
    const query = request.query as any;
    const days = query.days ? Number(query.days) : 30;
    return DocumentService.getExpiringDocuments(days);
  });

  fastify.post('/documents', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = request.user?.role === 'TENANT' ? request.user.tenantId || undefined : data.tenantId;

    try {
      const doc = await DocumentService.createDocument({
        ...data,
        tenantId,
        uploadedById: request.user?.userId,
      });

      await logAuditEvent(request, 'CREATE', 'Document', doc.id, { title: data.title });
      return reply.status(201).send(doc);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/documents/:id', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const deleted = await DocumentService.deleteDocument(id);
      await logAuditEvent(request, 'DELETE', 'Document', id);
      return deleted;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
