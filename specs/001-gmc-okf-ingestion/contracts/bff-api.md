# Contract: SPA ↔ Backend API

The React SPA (`src/app`) talks only to this API, served by the App Engine
backend (`src/backend`, research.md §1). The backend holds all Google
service credentials; none of these endpoints are callable from the browser
without a valid session established via the `AuthProvider` (research.md
§6).

All responses are JSON. All endpoints require an authenticated session
(`401` otherwise). Endpoints marked **Publisher-only** return `403` for a
Viewer session (FR-001a).

## Documents

### `GET /api/documents`
List archive documents available for selection (User Story 1, FR-001).

- Query: `?section=&q=`
- 200: `{ documents: ArchiveDocument[] }`

### `GET /api/documents/:id`
Fetch one archive document's current-version metadata, including
`metadataComplete` and `version`.

- 200: `ArchiveDocument`
- 404: unknown id

## Conversion & Publishing — **Publisher-only**

### `POST /api/batches`
Create a batch and kick off conversion for up to 50 documents (FR-011).
Each accepted document is written to Cloud Storage (if not already) and a
Pub/Sub message is published to start ingestion (research.md §2).

- Body: `{ archiveDocumentIds: string[] }`
- 201: `{ batchId: string }`
- 422: `{ error: "BATCH_TOO_LARGE", max: 50 }` when `archiveDocumentIds.length > 50` (FR-011)

### `GET /api/batches/:batchId`
Per-document status within a batch (FR-005, FR-011).

- 200: `{ batchId: string, documents: PipelineStatus[] }`

### `POST /api/documents/:id/convert`
Convert a single document via the Document AI ingestion pipeline (User
Story 1). Idempotent retry-safe (FR-010); extracts author/location/entities
when present (FR-002b).

- 200: `{ okfRecord: OkfRecord }`
- 422: `{ error: "INCOMPLETE_METADATA", missingFields: string[] }` (User Story 1, scenario #2)
- 422: `{ error: "UNSUPPORTED_FORMAT" }` (FR-002a)

### `POST /api/documents/:id/publish`
Publish a previously converted record to the Knowledge Catalog: persists
the `CatalogEntry` in the metadata store and indexes its embedding in the
vector index (User Story 2, research.md §3). If this `archiveDocumentId`
already has a `"current"` entry for an earlier version, the new entry
becomes `"current"` and the prior one is marked `"superseded"` (FR-007a)
rather than rejected.

- 200: `{ catalogEntry: CatalogEntry }`
- 409: `{ error: "ALREADY_PUBLISHED", catalogEntryId: string }` — only when
  the *same* `(archiveDocumentId, version)` is republished (FR-007, User
  Story 2 #2)
- 502: `{ error: "CATALOG_UNAVAILABLE" }` — retryable without re-converting (User Story 2 #3, FR-010)

### `POST /api/documents/:id/retry`
Retry the last failed action (convert or publish) without re-selecting the
document (FR-010).

- 200: `{ pipelineStatus: PipelineStatus }`

## Discoverability

### `GET /api/documents/:id/discoverability`
Check Agent Search discoverability for a published document — `true` once
its embedding is confirmed present/queryable in the vector index (User
Story 4, research.md §3).

- 200: `{ status: "pending" | "discoverable" }`

## Catalog Search & Download

### `GET /api/catalog/search`
Semantic search over Knowledge Catalog entries published by this
application, with optional structured filters (FR-013, SC-007). Only
`"current"` (non-superseded) entries are returned by default.

- Query: `?q=<natural-language query>&title=&section=&date=&includeSuperseded=false`
- 200: `{ results: CatalogEntry[] }`, ranked by semantic relevance to `q`
  (`results: []` when no matches — never an error, per User Story 3 #3)

### `GET /api/documents/:id/download`
Download the original source document (current version, unless
`?version=` is given) in its original format (FR-014).

- 200: binary stream, `Content-Type` reflects original format (`application/pdf`, image type, or `text/plain`/`text/markdown`)
- 404: `{ error: "SOURCE_UNAVAILABLE" }` (FR-015, edge case)

## History

### `GET /api/history`
Audit history of conversion/publish attempts (FR-009).

- Query: `?archiveDocumentId=&batchId=`
- 200: `{ attempts: AttemptRecord[] }`

## Auth

### `GET /api/session`
Resolve the current user and role via the active `AuthProvider`, backed by
Cloud Identity for the Google provider (research.md §6).

- 200: `{ user: User }`
- 401: no session
