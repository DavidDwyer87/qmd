import { getQdrantRuntimeConfig, type QdrantRuntimeConfig } from "./backend.js";

export type QdrantHealth = {
  ok: boolean;
  detail: string;
};

/**
 * Lightweight Phase 1 runtime probe for Qdrant availability.
 * Uses HTTP health endpoint so it works without extra dependencies.
 */
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
