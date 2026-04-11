# =============================================================================
# QMD (Query Markdown Documents) - Docker Image
# https://github.com/DavidDwyer87/qmd
# 
# Multi-purpose search engine for markdown knowledge bases:
#   - BM25 lexical search
#   - Vector semantic search (sqlite-vec + llama.cpp)
#   - Query expansion (LLM)
#   - MCP server for AI agent integration
#
# Ports:
#   80  - nginx reverse proxy (health, /mcp)
#   8181 - QMD MCP server (proxied via nginx)
#
# Volumes:
#   /data/models  - Embedding models + index (PVC)
#   /data/knowledge - Source documents (SMB mount)
# =============================================================================

FROM node:22-bookworm

# Install nginx for reverse proxy (QMD MCP binds localhost only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

# Install QMD globally from npm
RUN npm install -g @tobilu/qmd@2.1.0

# Create non-root user
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -m -s /bin/bash appuser

# Create data directories
RUN mkdir -p /data/knowledge /data/models /data/qmd && \
    chown -R appuser:appuser /data

# Copy nginx reverse proxy config
# QMD MCP server binds to [::1]:8181 (IPv6 localhost) — nginx on port 80
# proxies external traffic to it.
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Environment defaults
ENV QMD_DATA_DIR=/data/qmd \
    XDG_CACHE_HOME=/data/models \
    PORT=8181

WORKDIR /data
USER appuser

EXPOSE 80 8181

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
