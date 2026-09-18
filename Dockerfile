# ──────────────────────────────────────────────────────────────────────────────
# Rescom — Production Multi-Stage Dockerfile
# Stage 1: Build backend
# Stage 2: Build frontend
# Stage 3: Production runtime (minimal Node.js 24 Alpine)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Backend Build ────────────────────────────────────────────────────
FROM node:24-alpine AS backend-builder
WORKDIR /build/backend

# Copy and install dependencies first (Docker layer cache optimization)
COPY backend/package*.json ./
RUN npm ci --omit=dev=false

# Copy source and compile TypeScript → dist/
COPY backend/ ./
RUN npm run build

# ── Stage 2: Frontend Build ───────────────────────────────────────────────────
FROM node:24-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 3: Production Runtime ───────────────────────────────────────────────
FROM node:24-alpine AS production
LABEL maintainer="Rescom Team"
LABEL description="Rescom Mesh Communication Server - Production Build"
LABEL version="2.0.0"

# Create unprivileged app user for security hardening
RUN addgroup -g 1001 rescom && \
    adduser -u 1001 -G rescom -D -h /app rescom

WORKDIR /app

# Copy compiled backend
COPY --from=backend-builder --chown=rescom:rescom /build/backend/dist ./dist
COPY --from=backend-builder --chown=rescom:rescom /build/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=rescom:rescom /build/backend/package.json ./package.json

# Copy compiled frontend static assets (served by Express in production)
COPY --from=frontend-builder --chown=rescom:rescom /build/frontend/dist ./frontend/dist

# Create data directory for SQLite WAL database
RUN mkdir -p /app/data && chown rescom:rescom /app/data

# Switch to unprivileged user
USER rescom

# Expose Rescom API & WebSocket port
EXPOSE 3001

# Health check — verifies the server responds within 10s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Environment defaults (override via docker-compose or -e flags)
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/campus_grid.db

CMD ["node", "dist/server.js"]
