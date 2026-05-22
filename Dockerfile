# =============================================
# Mavro Admin — Multi-Stage Docker Build
# =============================================
# Build:  docker build -t mavro-admin .
# Run:    docker run -p 5000:5000 --env-file .env mavro-admin
# =============================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY client/ ./
RUN npm run build

# Stage 2: Production backend
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 mavro && adduser -u 1001 -G mavro -s /bin/sh -D mavro

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# Create logs directory
RUN mkdir -p logs && chown -R mavro:mavro /app

# Switch to non-root user
USER mavro

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Use dumb-init to handle PID 1 and forward signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
