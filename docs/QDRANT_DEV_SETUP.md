# Qdrant Dev Setup (Phase 1 baseline)

Use this baseline for local development when `QMD_VECTOR_BACKEND=qdrant`.

## 1) Start Qdrant

```bash
docker run -d --name qmd-qdrant \
  -p 6333:6333 \
  -v qmd_qdrant_data:/qdrant/storage \
  qdrant/qdrant:v1.13.2
```

## 2) Configure QMD runtime

```bash
export QMD_VECTOR_BACKEND=qdrant
export QMD_QDRANT_URL=http://127.0.0.1:6333
export QMD_QDRANT_COLLECTION=qmd_vectors
# Optional (must match embedding dimension if set)
# export QMD_QDRANT_DIMENSIONS=768
```

## 3) Verify backend health

```bash
qmd status
```

Expected status output includes:
- `Backend: qdrant`
- MCP `status` tool reports vector backend and Qdrant health

## Notes
- In this phase, Qdrant is the semantic vector backend when selected.
- Existing BM25 behavior remains available as fallback path.
