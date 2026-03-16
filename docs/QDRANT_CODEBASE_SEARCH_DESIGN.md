# QMD Design: Codebase Search + Qdrant Vector Store

## Summary
This design upgrades QMD for LLM-focused codebase search while switching vector storage from `sqlite-vec` to **Qdrant**.

The final system keeps:
- SQLite FTS/BM25 for lexical retrieval and metadata persistence
- Qdrant for vector indexing and similarity search
- MCP interfaces compatible with current `query/get/multi_get/status` flows

## Goals
1. Support first-class codebase retrieval (not markdown-only behavior).
2. Use Qdrant as the vector backend for semantic retrieval.
3. Preserve backward-compatible CLI/MCP experience for existing users.
4. Keep hybrid ranking quality (BM25 + vector + rerank).

## Non-goals (v1)
- Full language server/indexer parity.
- Direct Trello tools inside QMD core.
- Replacing SQLite metadata/doc storage.

## Current-state constraints
- Default collection glob is markdown-first.
- Chunking logic is markdown-oriented.
- Vector index lifecycle is tightly coupled to sqlite-vec tables.

## Proposed Architecture

### 1) Retrieval pipeline
- **Lexical path**: unchanged (SQLite FTS5 BM25).
- **Vector path**: replace sqlite-vec operations with a `VectorStore` abstraction backed by Qdrant.
- **Fusion/rerank**: unchanged strategy, but vector candidates come from Qdrant.

### 2) Storage split
- **SQLite** keeps:
  - collections, documents, content, contexts, and FTS index
  - embedding metadata references (hash/seq/model/timestamps)
- **Qdrant** keeps:
  - embedding vectors keyed by deterministic point ID (`{hash}_{seq}`)
  - payload for filtering and citations (`collection`, `path`, `hash`, `seq`, `pos`, `language`, optional symbols)

### 3) Code-aware indexing
- Expand file patterns to include common code extensions.
- Add language detection from extension.
- Introduce code-aware chunking boundaries (functions/classes/methods/module blocks) with markdown fallback.
- Enrich indexed metadata with `language`, `startLine`, `endLine`, optional `symbolName`/`symbolKind`.

## API and Interface Changes

### Configuration
Add vector backend config with safe defaults:
- `vector.backend`: `qdrant` (default for this fork)
- `vector.qdrant.url`
- `vector.qdrant.apiKey` (optional)
- `vector.qdrant.collection`
- `vector.qdrant.dimensions`

### Internal interface
Add `VectorStore` interface used by embedding/search code paths:
- `ensureCollection(dimensions)`
- `upsert(points[])`
- `search(vector, limit, filters?)`
- `deleteByIds(ids[])`
- `deleteByFilter(filter)`
- `health()`

Implementations:
- `QdrantVectorStore` (active)
- `SqliteVecVectorStore` (optional compatibility adapter during migration period)

### MCP/CLI behavior
- Keep existing tool names and CLI commands.
- `status` adds vector backend health block (backend type, collection, point count if available).
- Errors should clearly indicate Qdrant connectivity/config issues.

## Trello Integration Positioning
- Do **not** embed Trello API tools inside QMD core.
- Use `mcp-server-trello` as a separate MCP server and compose at client/orchestrator level.
- If a single-agent workflow is needed, implement a unified orchestrator tool in `robose-mcp` that calls:
  1) QMD MCP
  2) Trello MCP
  3) Qdrant-backed semantic operations

## Data Flow
1. Reindex scans files (markdown + code patterns).
2. Content is chunked with language-aware strategy.
3. Embeddings are generated.
4. Metadata rows are upserted in SQLite.
5. Vectors are upserted in Qdrant using deterministic point IDs.
6. Query execution:
   - BM25 from SQLite
   - semantic KNN from Qdrant
   - reciprocal fusion + reranking
   - contextual snippets + line anchors returned.

## Migration Plan
1. Introduce `VectorStore` abstraction behind existing vector calls.
2. Add Qdrant client and collection bootstrap.
3. Add dual-write feature flag (optional short phase): sqlite-vec + Qdrant.
4. Verify retrieval parity using fixed query set.
5. Switch read path to Qdrant.
6. Remove sqlite-vec hard dependency from default path.

## Testing and Acceptance

### Unit
- VectorStore contract tests (upsert/search/delete/health).
- Code chunker tests per language + markdown fallback.
- Metadata mapping tests for line/symbol payload.

### Integration
- End-to-end index + query with local Qdrant container.
- Failure-path tests (Qdrant unavailable, collection missing, dimension mismatch).
- MCP `status`/`query` behavior with Qdrant backend.

### Acceptance criteria
- Code symbols retrievable by natural language and exact symbol query.
- Returned hits contain file paths and usable line anchors.
- Hybrid quality does not regress for markdown collections.
- Qdrant health visible via status surfaces.

## Rollout
1. Release behind config gating for initial adopters.
2. Publish migration notes and env/config examples.
3. Promote Qdrant backend to default for this fork after parity validation.

## Risks and mitigations
- **Risk**: relevance drift from changed vector backend.
  - **Mitigation**: fixed benchmark set + parity thresholds.
- **Risk**: operational complexity (external vector service).
  - **Mitigation**: clear health checks, startup validation, actionable errors.
- **Risk**: larger indexing cost for codebases.
  - **Mitigation**: extension allowlist + ignore defaults + batch controls.
