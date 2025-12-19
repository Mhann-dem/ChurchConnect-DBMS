# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - serve with Node
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files (change 'build' to 'dist' if using Vite)
COPY --from=builder /app/build ./build

# Expose port
EXPOSE $PORT

# Start serve (change 'build' to 'dist' if using Vite)
CMD serve -s build -l $PORT