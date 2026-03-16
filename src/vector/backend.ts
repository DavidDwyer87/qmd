export type VectorBackend = "sqlite-vec" | "qdrant";

export type QdrantRuntimeConfig = {
  url: string;
  apiKey?: string;
  collection: string;
  dimensions?: number;
};

/**
 * Runtime-only backend selector for Phase 1 migration work.
 * Defaults to sqlite-vec to preserve upstream behavior.
 */
export function getConfiguredVectorBackend(): VectorBackend {
  const raw = (process.env.QMD_VECTOR_BACKEND || "sqlite-vec").toLowerCase();
  if (raw === "qdrant") return "qdrant";
  return "sqlite-vec";
}

export function getQdrantRuntimeConfig(): QdrantRuntimeConfig {
  const dimensions = process.env.QMD_QDRANT_DIMENSIONS
    ? Number(process.env.QMD_QDRANT_DIMENSIONS)
    : undefined;

  return {
    url: process.env.QMD_QDRANT_URL || "http://127.0.0.1:6333",
    apiKey: process.env.QMD_QDRANT_API_KEY,
    collection: process.env.QMD_QDRANT_COLLECTION || "qmd_vectors",
    ...(Number.isFinite(dimensions) ? { dimensions } : {}),
  };
}
