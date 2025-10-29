# Multi-stage build for WhatsApp Flow Server
# Supports AMD64 and ARM64 architectures

# ======================
# Stage 1: Builder
# ======================
FROM node:25-alpine AS builder

# Build arguments
ARG VERSION=dev
ARG BUILD_DATE=unknown

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build && \
    echo "Build version: ${VERSION}" && \
    echo "Build date: ${BUILD_DATE}"

# ======================
# Stage 2: Production
# ======================
FROM node:25-alpine

# Metadata labels
LABEL maintainer="Guilherme Jansen"
LABEL org.opencontainers.image.title="WhatsApp Flow Server"
LABEL org.opencontainers.image.description="WhatsApp Flow Server with DDD architecture"
LABEL org.opencontainers.image.source="https://github.com/guilhermejansen/whatsapp-flow"
LABEL org.opencontainers.image.vendor="Guilherme Jansen"

# Build arguments
ARG VERSION=dev
ARG BUILD_DATE=unknown

# Environment labels
LABEL version="${VERSION}"
LABEL build.date="${BUILD_DATE}"

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini \
    ca-certificates \
    postgresql-client && \
    update-ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Install tsx globally for running TypeScript scripts
RUN npm install -g tsx@4.20.6

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy scripts for runtime usage (migrations, key generation, etc)
COPY scripts ./scripts
COPY tsconfig.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories
RUN mkdir -p /app/logs /app/keys && \
    chmod 755 /app/logs /app/keys

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

# Start application
CMD ["node", "dist/main.js"]
