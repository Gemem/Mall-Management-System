import fastify, { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { authRoutes } from './routes/authRoutes.js';
import { mallRoutes } from './routes/mallRoutes.js';
import { shopRoutes } from './routes/shopRoutes.js';
import { tenantRoutes } from './routes/tenantRoutes.js';
import { leaseRoutes } from './routes/leaseRoutes.js';
import { billingRoutes } from './routes/billingRoutes.js';
import { paymentRoutes } from './routes/paymentRoutes.js';
import { maintenanceRoutes } from './routes/maintenanceRoutes.js';
import { announcementRoutes } from './routes/announcementRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { auditRoutes } from './routes/auditRoutes.js';
import { jobRoutes } from './routes/jobRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

dotenv.config();

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' },
  });

  // CORS
  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Rate Limiting
  app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
  });

  // JWT Auth
  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'mall_management_super_secret_jwt_key_2026',
  });

  // OpenAPI / Swagger Documentation
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Mall Management System (MMS) API',
        description: 'Production-ready REST API for commercial shopping mall administration, shop inventory, tenant management, automated recurring rent billing, multi-obligation payments, maintenance workflows and analytics.',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:5000', description: 'Local Development Server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Global Error Handler
  app.setErrorHandler((error: any, request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected server error occurred.',
      statusCode,
    });
  });

  // Register API Routes
  app.register(
    async (api) => {
      api.register(authRoutes, { prefix: '/auth' });
      api.register(mallRoutes);
      api.register(shopRoutes);
      api.register(tenantRoutes);
      api.register(leaseRoutes);
      api.register(billingRoutes);
      api.register(paymentRoutes);
      api.register(maintenanceRoutes);
      api.register(announcementRoutes);
      api.register(documentRoutes);
      api.register(reportRoutes);
      api.register(dashboardRoutes);
      api.register(auditRoutes);
      api.register(jobRoutes);
      api.register(userRoutes);
    },
    { prefix: '/api/v1' }
  );

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Serve static client bundle if client/dist exists
  const clientDistPath = path.resolve(process.cwd(), '../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/',
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url && request.raw.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'NotFound', message: `API route ${request.raw.url} not found` });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
