import { FastifyInstance } from 'fastify';
import { JobService } from '../services/jobService.js';
import { authenticate, authorize } from '../middleware/auth.js';

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.post('/jobs/run-checks', { preHandler: [authenticate, authorize(['MALL_OWNER', 'MALL_MANAGER'])] }, async () => {
    const results = await JobService.runAutomatedChecks();
    return {
      success: true,
      message: 'Background overdue invoice flags and lease expiry scans completed.',
      results,
    };
  });
}
