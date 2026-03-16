# Code Search Benchmark Corpus (Phase 1)

This folder contains deterministic fixtures for code-search benchmarking:
- `corpus/ts/*` and `corpus/python/*` sample code files
- `queries.json` expected top-hit paths
- `benchmark.ts` latency benchmark runner

## Run

1) Add this corpus as a QMD collection and index/embed it.
2) Set `INDEX_PATH` to the benchmark index sqlite file.
3) Run benchmark (defaults to 10 rounds/query):

```bash
INDEX_PATH=/path/to/index.sqlite bun test/eval-code/benchmark.ts
```

Optional:
- `INDEX_PATH=/path/to/index.sqlite QMD_BENCH_ROUNDS=20 bun test/eval-code/benchmark.ts`

Benchmark mode notes:
- Hybrid path is measured via `hybridQuery(..., { skipRerank: true })` in-process.
- BM25 path is measured via `store.searchFTS(...)` in-process.

## SLO Gate

- Hybrid (`qmd query`) p95 <= 400ms
- BM25-only (`qmd search`) p95 <= 200ms
