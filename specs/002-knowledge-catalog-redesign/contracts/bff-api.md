# Contract: SPA ↔ Backend API (additions/changes over feature 001)

Feature 001's `bff-api.md` remains the contract for every endpoint not
listed here (`GET/POST /api/documents*`, `/api/batches*`,
`/api/documents/:id/publish`, `/api/documents/:id/retry`,
`/api/documents/:id/discoverability`, `/api/catalog/search`,
`/api/documents/:id/download`, `/api/history`, `/api/session`) — those
endpoints' request/response shapes and auth requirements are unchanged.
This document covers only what's new or changed for this feature.

All endpoints below require an authenticated session (`401` otherwise),
same as feature 001. Endpoints marked **Editor-only** return `403` for a
Researcher session (FR-013's capability-gating).

## Ask & Search

### `POST /api/ask`

Submit a question for the conversational Ask & Search experience
(FR-002, FR-004a, FR-004b).

- Body: `{ question: string }`
- 200: `{ answer: string, sources: Array<{ archiveDocumentId: string, title: string, snippet: string }> }`
  — `sources: []` when nothing relevant was retrieved (best-effort answer
  still returned, per User Story 1 #3); every call is logged per FR-004b
  regardless of outcome
- 502: `{ error: "ASK_FAILED" }` — the retrieval or generative-answer
  service failed or timed out (FR-004a); the client preserves the user's
  question and offers retry, the server does not persist any partial state
  to retry against (retry is simply resubmitting the same question)

## Favorites

### `GET /api/favorites`

List the current user's favorited documents (FR-008).

- 200: `{ documents: ArchiveDocument[] }`

### `POST /api/favorites/:archiveDocumentId`

Favorite a document (FR-007). Idempotent.

- 200: `{ favorited: true }`
- 404: `{ error: "DOCUMENT_NOT_FOUND" }`

### `DELETE /api/favorites/:archiveDocumentId`

Unfavorite a document (FR-007). Idempotent — succeeds even if it wasn't
favorited.

- 200: `{ favorited: false }`

## Upload (new document creation)

### `POST /api/documents`

Create a new `ArchiveDocument` from an uploaded file and run it through
convert + publish in one pipeline (FR-010, research.md §4). **Publisher/
Editor-only** (same capability gate as the rest of the conversion/publish
surface, FR-009).

- Body: multipart `{ file: binary, title?: string, section?: string }`
- 201: `{ archiveDocumentId: string, catalogEntry: CatalogEntry }` — file
  was accepted, created, converted, and published in one request
- 422: `{ error: "UNSUPPORTED_FORMAT" }` (FR-010a) — checked before any
  upload begins
- 422: `{ error: "FILE_TOO_LARGE", maxBytes: 52428800 }` (FR-010b, 50MB) —
  checked before any upload begins
- 502: `{ error: "CONVERSION_FAILED" }` or `{ error: "CATALOG_UNAVAILABLE" }`
  — the file was stored but conversion/publish failed; same retry path as
  feature 001's `POST /api/documents/:id/retry` applies to the resulting
  `archiveDocumentId`

## Access Requests

### `POST /api/access-requests`

Submit (or update, if already pending) an access request (FR-017). No
authentication required — this is the unprovisioned-visitor entry point.

- Body: `{ name: string, email: string, affiliation?: string, reason: string }`
- 200: `{ status: "pending" }`
- 422: `{ error: "INVALID_REQUEST", missingFields: string[] }` — missing
  name/email/reason or an invalid email format

### `GET /api/access-requests` — **Editor-only**

List all pending access requests (FR-018).

- 200: `{ requests: AccessRequest[] }`

### `POST /api/access-requests/:email/approve` — **Editor-only**

Approve a pending request, provisioning a new Researcher-role user
(FR-018).

- 200: `{ request: AccessRequest, provisionedUserId: string }`
- 404: `{ error: "REQUEST_NOT_FOUND" }`
- 409: `{ error: "ALREADY_DECIDED" }` — request is not `"pending"`

### `POST /api/access-requests/:email/deny` — **Editor-only**

Deny a pending request (FR-018).

- 200: `{ request: AccessRequest }`
- 404: `{ error: "REQUEST_NOT_FOUND" }`
- 409: `{ error: "ALREADY_DECIDED" }`

## Session (behavior note, no shape change)

`GET /api/session`'s response `User.role` values are unchanged
(`"viewer" | "publisher"`); the SPA is responsible for rendering them as
"Researcher"/"Editor" (FR-013) — this is a presentation-layer mapping, not
an API contract change.
