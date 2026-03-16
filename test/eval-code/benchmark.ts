import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type EvalQuery = { query: string; expectedTopPath: string };

type BenchResult = {
  query: string;
  mode: "hybrid" | "bm25";
  elapsedMs: number;
  topPath?: string;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)]!;
}

function runQmd(command: string): string {
  return execSync(command, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

function runQuery(mode: "hybrid" | "bm25", query: string): { elapsedMs: number; topPath?: string } {
  const base = `bun src/cli/qmd.ts ${mode === "hybrid" ? "query" : "search"} ${JSON.stringify(query)} --json -n 1`;
  const start = performance.now();
  const out = runQmd(base);
  const elapsedMs = performance.now() - start;

  try {
    const rows = JSON.parse(out) as Array<{ file?: string }>;
    return { elapsedMs, topPath: rows[0]?.file };
  } catch {
    return { elapsedMs, topPath: undefined };
  }
}

function main() {
  const queryPath = resolve("test/eval-code/queries.json");
  const queries = JSON.parse(readFileSync(queryPath, "utf-8")) as EvalQuery[];
  const rounds = Number(process.env.QMD_BENCH_ROUNDS ?? "5");

  const results: BenchResult[] = [];

  for (const item of queries) {
    for (let i = 0; i < rounds; i++) {
      const hybrid = runQuery("hybrid", item.query);
      results.push({ query: item.query, mode: "hybrid", elapsedMs: hybrid.elapsedMs, topPath: hybrid.topPath });

      const bm25 = runQuery("bm25", item.query);
      results.push({ query: item.query, mode: "bm25", elapsedMs: bm25.elapsedMs, topPath: bm25.topPath });
    }
  }

  const hybridLat = results.filter(r => r.mode === "hybrid").map(r => r.elapsedMs);
  const bm25Lat = results.filter(r => r.mode === "bm25").map(r => r.elapsedMs);

  const p95Hybrid = percentile(hybridLat, 95);
  const p95Bm25 = percentile(bm25Lat, 95);

  console.log(JSON.stringify({
    corpus: "test/eval-code/corpus",
    rounds,
    samples: results.length,
    p95HybridMs: Number(p95Hybrid.toFixed(2)),
    p95Bm25Ms: Number(p95Bm25.toFixed(2)),
    slo: {
      hybridMs: 400,
      bm25Ms: 200,
      hybridPass: p95Hybrid <= 400,
      bm25Pass: p95Bm25 <= 200,
    },
  }, null, 2));
}

main();
