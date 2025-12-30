# ZGRAD.gg Docker Configuration
# Multi-stage build for optimized production image

# ================================
# Stage 1: Build frontend assets
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build frontend assets
RUN npm run build

# ================================
# Stage 2: Production image
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies for native modules
RUN apk add --no-cache python3 make g++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S zgrad -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server ./server

# Copy JS config files (needed by server for serverConfig.js)
COPY js ./js

# Copy other necessary files
COPY loadingscreen ./loadingscreen
COPY images ./images

# Create data directories with proper permissions
RUN mkdir -p /app/server/data/uploads && \
    chown -R zgrad:nodejs /app/server/data

# Switch to non-root user
USER zgrad

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server/server.js"]

