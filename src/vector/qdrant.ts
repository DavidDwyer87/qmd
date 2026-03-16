import { getQdrantRuntimeConfig, type QdrantRuntimeConfig } from "./backend.js";

export type QdrantHealth = {
  ok: boolean;
  detail: string;
};

export type QdrantPoint = {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
};

export type QdrantSearchHit = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

function headers(config: QdrantRuntimeConfig): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(config.apiKey ? { "api-key": config.apiKey } : {}),
  };
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`qdrant request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function probeQdrantHealth(config?: QdrantRuntimeConfig): Promise<QdrantHealth> {
  const cfg = config ?? getQdrantRuntimeConfig();
  const healthUrl = new URL("/healthz", cfg.url).toString();

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: cfg.apiKey ? { "api-key": cfg.apiKey } : undefined,
    });

    if (!res.ok) {
      return { ok: false, detail: `qdrant returned ${res.status}` };
    }

    return { ok: true, detail: "healthy" };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "unreachable",
    };
  }
}

export async function ensureQdrantCollection(dimensions: number, config?: QdrantRuntimeConfig): Promise<void> {
  const cfg = config ?? getQdrantRuntimeConfig();
  const collectionName = cfg.collection;
  const collectionUrl = new URL(`/collections/${collectionName}`, cfg.url).toString();

  const existing = await fetch(collectionUrl, {
    method: "GET",
    headers: cfg.apiKey ? { "api-key": cfg.apiKey } : undefined,
  });

  if (existing.ok) {
    const data = await existing.json() as { result?: { config?: { params?: { vectors?: { size?: number } } } } };
    const currentSize = data?.result?.config?.params?.vectors?.size;
    if (cfg.dimensions && currentSize && cfg.dimensions !== currentSize) {
      throw new Error(`Qdrant collection dimension mismatch: expected ${cfg.dimensions}, found ${currentSize}`);
    }
    if (currentSize && currentSize !== dimensions) {
      throw new Error(`Qdrant collection dimension mismatch: embedding=${dimensions}, collection=${currentSize}`);
    }
    return;
  }

  if (existing.status !== 404) {
    throw new Error(`qdrant collection check failed: ${existing.status} ${existing.statusText}`);
  }

  await requestJson(collectionUrl, {
    method: "PUT",
    headers: headers(cfg),
    body: JSON.stringify({
      vectors: {
        size: cfg.dimensions ?? dimensions,
        distance: "Cosine",
      },
    }),
  });
}

export async function upsertQdrantPoints(points: QdrantPoint[], config?: QdrantRuntimeConfig): Promise<void> {
  if (points.length === 0) return;
  const cfg = config ?? getQdrantRuntimeConfig();
  const upsertUrl = new URL(`/collections/${cfg.collection}/points?wait=true`, cfg.url).toString();

  await requestJson(upsertUrl, {
    method: "PUT",
    headers: headers(cfg),
    body: JSON.stringify({ points }),
  });
}

export async function searchQdrant(vector: number[], limit: number, config?: QdrantRuntimeConfig): Promise<QdrantSearchHit[]> {
  const cfg = config ?? getQdrantRuntimeConfig();
  const searchUrl = new URL(`/collections/${cfg.collection}/points/search`, cfg.url).toString();
  const data = await requestJson<{ result?: QdrantSearchHit[] }>(searchUrl, {
    method: "POST",
    headers: headers(cfg),
    body: JSON.stringify({ vector, limit, with_payload: true }),
  });
  return data.result || [];
}
