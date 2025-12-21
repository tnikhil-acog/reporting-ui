FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy .npmrc for private registry access
COPY .npmrc ./

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
# Use --no-frozen-lockfile for flexibility in build environments
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm in production image
RUN npm install -g pnpm

# Copy .npmrc for private registry access
COPY .npmrc ./

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the app
CMD ["pnpm", "start"]