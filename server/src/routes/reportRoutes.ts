import { FastifyInstance } from 'fastify';
import { ReportService } from '../services/reportService.js';
import { authenticate, authorize } from '../middleware/auth.js';

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.get('/reports/summary', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'])] }, async (request) => {
    const query = request.query as any;
    return ReportService.getFinancialSummary(query.periodStart, query.periodEnd);
  });

  fastify.get('/reports/aging-receivables', { preHandler: [authenticate, authorize(['MALL_OWNER', 'ACCOUNTANT'])] }, async () => {
    return ReportService.getAgingReceivables();
  });

  fastify.get('/reports/occupancy', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async () => {
    return ReportService.getOccupancyReport();
  });

  fastify.get('/reports/expiring-leases', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async (request) => {
    const query = request.query as any;
    const days = query.days ? Number(query.days) : 60;
    return ReportService.getExpiringLeases(days);
  });

  fastify.get('/reports/export-csv', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'])] }, async (request, reply) => {
    const query = request.query as any;
    const type = query.type || 'invoices';

    try {
      const csv = await ReportService.generateCsv(type);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
      return reply.send(csv);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
