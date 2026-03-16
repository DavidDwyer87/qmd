# Code Search Benchmark Corpus (Phase 1)

This folder contains deterministic fixtures for code-search benchmarking:
- `corpus/ts/*` and `corpus/python/*` sample code files
- `queries.json` expected top-hit paths
- `benchmark.ts` latency benchmark runner

## Run

1) Add this corpus as a QMD collection and index/embed it.
2) Run benchmark (defaults to 5 rounds/query):

```bash
bun test/eval-code/benchmark.ts
```

Optional:
- `QMD_BENCH_ROUNDS=10 bun test/eval-code/benchmark.ts`

## SLO Gate

- Hybrid (`qmd query`) p95 <= 400ms
- BM25-only (`qmd search`) p95 <= 200ms
