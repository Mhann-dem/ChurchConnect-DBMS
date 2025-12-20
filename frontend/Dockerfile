# Multi-stage build for production optimization - Railway Ready
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set build-time environment
ENV CI=true

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Copy production environment if it exists
RUN test -f .env.production && cp .env.production ./ || true

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Set working directory
WORKDIR /app

# Install serve globally for serving static files
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy public assets if they exist
RUN test -d /app/public && cp -r /app/public ./public || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "build", "-l", "3000"]

