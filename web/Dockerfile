# Dockerfile for Internet-ID Web Application (Next.js)
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies required for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files for web
COPY web/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root dependencies (needed for Prisma schema)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps

# Copy web dependencies from deps stage
COPY --from=deps /app/node_modules ./web/node_modules
COPY web ./web

# Generate Prisma client for web
RUN cd web && npm run prisma:generate

# Build Next.js app
WORKDIR /app/web
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose web port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start Next.js server
CMD ["node", "server.js"]
