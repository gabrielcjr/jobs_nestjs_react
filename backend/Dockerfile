# Build stage (compiled natively on host platform for 10x faster multi-arch builds)
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY global-hiring-companies.csv ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && (npm run prisma:seed || true) && node dist/src/main.js"]
