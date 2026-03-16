# Code Search Benchmark Corpus (Phase 1)

This folder is the bootstrap location for code-search benchmark fixtures used to measure:
- Hybrid query latency (p95)
- BM25-only fallback latency (p95)
- Symbol/code retrieval relevance over representative queries

Initial Phase 1 action:
- Add small, deterministic code fixtures for TS/JS and Python
- Add query list + expected top-hit paths for regression tracking

Future phases can expand this corpus by language and repository size.
