# Multi-stage production Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root manifest and workspaces
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy application sources
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client & Build workspaces
RUN npm run db:generate --workspace=server
RUN npm run build --workspace=server
RUN npm run build --workspace=client

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev --workspace=server

# Copy compiled artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
