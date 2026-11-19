# ==============================================================================
# Production Multi-Stage Dockerfile for School Transport Safety Platform API
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests before installing.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies including devDependencies for build.
RUN npm ci

# Build the shared workspace packages and API output used by the runtime command.
RUN npm --prefix packages/shared-types run build \
  && npm --prefix packages/constants run build \
  && npm --prefix packages/utils run build \
  && npm --prefix packages/validation run build \
  && npm --prefix packages/client-sdk run build \
  && npm --prefix apps/api run build

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

CMD ["npm", "--prefix", "apps/api", "run", "start"]
