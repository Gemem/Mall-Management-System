import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/paymentService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.get('/payments', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as any;
    let tenantId = query.tenantId;

    if (request.user?.role === 'TENANT') {
      tenantId = request.user.tenantId;
    }

    return PaymentService.getPayments({
      tenantId,
      leaseId: query.leaseId,
      status: query.status,
      search: query.search,
    });
  });

  fastify.get('/payments/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const payment = await PaymentService.getPaymentById(id);
      if (request.user?.role === 'TENANT' && request.user.tenantId !== payment.tenantId) {
        return reply.status(403).send({ error: 'Access denied to this payment record.' });
      }
      return payment;
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/payments', { preHandler: [authenticate, authorize(['MALL_OWNER', 'ACCOUNTANT'])] }, async (request, reply) => {
    const data = request.body as any;
    try {
      const result = await PaymentService.recordPayment({
        tenantId: data.tenantId,
        leaseId: data.leaseId,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        recordedById: request.user?.userId,
        notes: data.notes,
        autoAllocate: data.autoAllocate ?? true,
        invoiceAllocations: data.invoiceAllocations,
      });

      await logAuditEvent(request, 'PAYMENT_RECORDED', 'Payment', result.payment.id, {
        amount: data.amount,
        method: data.paymentMethod,
        receipt: result.receipt.receiptNumber,
      });

      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/payments/:id/reverse', { preHandler: [authenticate, authorize(['MALL_OWNER', 'ACCOUNTANT'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };

    try {
      const result = await PaymentService.reversePayment(id, {
        reason,
        authorizedById: request.user?.userId,
      });

      await logAuditEvent(request, 'PAYMENT_REVERSED', 'Payment', id, {
        reason,
        reversalNumber: result.reversal.reversalNumber,
      });

      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/receipts/:paymentId', { preHandler: [authenticate] }, async (request, reply) => {
    const { paymentId } = request.params as { paymentId: string };
    try {
      const receipt = await PaymentService.getReceiptByPaymentId(paymentId);
      if (request.user?.role === 'TENANT' && request.user.tenantId !== receipt.payment.tenantId) {
        return reply.status(403).send({ error: 'Access denied to this receipt.' });
      }
      return receipt;
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
