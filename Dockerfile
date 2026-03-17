# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    build-essential \
    libatomic1 \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g bun@1.3.8

WORKDIR /app

COPY package.json bun.lock tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY bin ./bin

RUN bun install --frozen-lockfile
RUN bun run build
RUN bun install --frozen-lockfile --production

FROM node:24-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libatomic1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    XDG_CACHE_HOME=/data/cache \
    QMD_CONFIG_DIR=/data/config \
    QMD_VECTOR_BACKEND=qdrant \
    QMD_QDRANT_URL=http://qdrant:6333 \
    QMD_QDRANT_COLLECTION=qmd_vectors

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin

RUN mkdir -p /data/cache /data/config && chown -R node:node /app /data

USER node

EXPOSE 8181

CMD ["node", "dist/cli/qmd.js", "mcp", "--http", "--port", "8181"]
