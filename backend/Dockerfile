# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only + prisma CLI for migrations
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy compiled build from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Entrypoint executes db push to ensure schema is synced, runs seed if needed, and launches NestJS server
CMD ["sh", "-c", "npx prisma db push && (npm run prisma:seed || true) && node dist/src/main.js"]
