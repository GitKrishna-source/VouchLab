# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and client dependencies
COPY package.json ./
COPY client/package*.json ./client/
RUN npm install --prefix client

# Copy client source and build
COPY client/ ./client/
RUN npm run build --prefix client

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

# Copy server code and pre-compiled client assets
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Ensure persistent uploads directory exists
RUN mkdir -p /app/server/uploads /app/server/data

EXPOSE 5000

# Start server
CMD ["node", "server/src/index.js"]

