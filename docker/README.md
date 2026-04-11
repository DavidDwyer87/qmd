# QMD Docker Image

Production Docker image for [QMD](https://github.com/DavidDwyer87/qmd) — Query Markdown Documents search engine.

## What's Inside

| Component | Purpose |
|---|---|
| `@tobilu/qmd@2.1.0` | QMD CLI + MCP server (installed via npm) |
| nginx | Reverse proxy — QMD MCP binds localhost, nginx exposes on port 80 |
| `entrypoint.sh` | First-run init (collection add, embed), then starts nginx + QMD MCP |

## Ports

| Port | Service |
|---|---|
| 80 | nginx reverse proxy (health check at `/health`, MCP at `/mcp`) |
| 8181 | QMD MCP HTTP server (proxied via nginx) |

## Volumes

| Path | Purpose |
|---|---|
| `/data/models` | Embedding models + index (persistent PVC) |
| `/data/knowledge` | Source markdown documents (SMB mount or bind) |
| `/data/qmd` | QMD internal data |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `QMD_DATA_DIR` | `/data/qmd` | QMD data directory |
| `XDG_CACHE_HOME` | `/data/models` | Model download cache |
| `PORT` | `8181` | QMD MCP server port |
| `COLLECTION_NAME` | `knowledge` | Default collection name |
| `KNOWLEDGE_DIR` | `/data/knowledge` | Source documents path |
| `AUTO_UPDATE` | `false` | Re-index on container start if `true` |

## Quick Start

```bash
# Build
docker build -t qmd-tobilu .

# Run with local docs
docker run -d \
  -p 8080:80 \
  -v ./docs:/data/knowledge:ro \
  -v qmd-data:/data/models \
  qmd-tobilu
```

### Docker Compose

```yaml
services:
  qmd:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./docs:/data/knowledge:ro
      - qmd-data:/data/models
    environment:
      - COLLECTION_NAME=knowledge

volumes:
  qmd-data:
```

## Kubernetes (k3s)

Deployed as part of the `cicadia-stack` Helm chart in the `cicadia-system` namespace. See the infrastructure repo for Helm values and templates.

## Rebuilding

```bash
docker build -t daviddwyer1987/qmd-tobilu:latest .
docker push daviddwyer1987/qmd-tobilu:latest
```
