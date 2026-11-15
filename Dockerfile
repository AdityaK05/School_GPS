# ==============================================================================
# Production Multi-Stage Dockerfile for School Transport Safety Platform API
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/constants/package.json ./packages/constants/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/
COPY packages/client-sdk/package.json ./packages/client-sdk/
COPY apps/api/package.json ./apps/api/

# Install dependencies including devDependencies for build
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Typecheck and verify
RUN npm run typecheck

# Runner stage (Lean runtime)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
USER node

# Copy files from builder
COPY --chown=node:node --from=builder /app ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["npm", "run", "start:api"]
