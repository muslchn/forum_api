# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Runtime
FROM node:20-alpine

# Set Node environment to production
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy node_modules and package files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# Copy application code
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs migrations ./migrations

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/users', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})"

# Start the application with exec form (important for signal handling)
CMD ["node", "src/app.js"]
