import { FastifyInstance } from 'fastify';
import { DashboardService } from '../services/dashboardService.js';
import { authenticate } from '../middleware/auth.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard', { preHandler: [authenticate] }, async (request) => {
    return DashboardService.getDashboardMetrics(request.user);
  });
}
