# Quickstart: GMC Archive to Open Knowledge Publisher

Validation guide for proving the feature works end-to-end once
implemented. See [data-model.md](./data-model.md) for entity shapes and
[contracts/](./contracts/) for the API/interface contracts referenced
below.

## Prerequisites

- Node.js 20 LTS, `npm install` at the repo root
- A Google Cloud project with: a Cloud Storage bucket, a Pub/Sub topic +
  subscription, a Document AI processor, and a vector search index/endpoint
  provisioned via Cloud SDK (research.md §1–§3, §8) — credentials
  configured for `src/backend` only, never exposed to the SPA
- At least one `ArchiveDocument` available in each supported source format
  (PDF, scanned image, plain text/markdown — FR-002a) for manual testing

## Setup

```bash
npm install
npm run lint        # ESLint rules from research.md §10
npm run typecheck    # tsc --noEmit, strict mode, no implicit any
```

## Run

```bash
npm run dev:backend   # starts src/backend (App Engine app, local emulator) against configured Google credentials
npm run dev:app        # starts the React SPA (HashRouter) against the backend
```

## Validation scenarios

### 1. Convert a single document (User Story 1)

1. Sign in as a Publisher.
2. From the document browser view, select one `ArchiveDocument` with
   complete metadata.
3. Initiate conversion — this uploads to Cloud Storage, publishes a
   Pub/Sub message, and runs it through Document AI (research.md §2).
4. **Expect**: an `OkfRecord` is produced containing title, date, section,
   source identifier, and any extracted author/location/entities
   (`POST /api/documents/:id/convert` → 200; FR-002b).
5. Repeat with a document that has missing metadata.
6. **Expect**: a 422 `INCOMPLETE_METADATA` response naming the missing
   fields; the source document is not discarded.

### 2. Publish to the Knowledge Catalog (User Story 2)

1. Using the `OkfRecord` from scenario 1, publish it — this writes a
   `CatalogEntry` and indexes its embedding (research.md §3).
2. **Expect**: 200 with a `catalogEntryId` and `version: 1`.
3. Attempt to publish the same `archiveDocumentId` at the same version
   again.
4. **Expect**: 409 `ALREADY_PUBLISHED` (FR-007, SC-005).
5. Correct the source document and republish it.
6. **Expect**: 200 with `version: 2`; the prior version's `CatalogEntry`
   becomes `status: "superseded"` rather than being deleted (FR-007a).

### 3. Query the catalog and download (User Story 3)

1. As a Viewer (no Publisher permissions needed), search the catalog with
   a natural-language description of the document's topic (not its exact
   title) using `GET /api/catalog/search?q=...`.
2. **Expect**: the published entry appears, ranked by relevance
   (FR-013, SC-007).
3. Apply a section or date filter on top of the same query.
4. **Expect**: results narrow to those also matching the filter.
5. Search for a topic with no matching published entries.
6. **Expect**: `{ results: [] }`, not an error (User Story 3 #3).
7. Download the source document for the published entry.
8. **Expect**: the file is returned in its original format (no PDF
   conversion if the original was a scan or plain text — FR-014).

### 4. Confirm Agent Search discoverability (User Story 4)

1. Immediately after publishing in scenario 2, check discoverability
   status for the entry.
2. **Expect**: `"pending"` (the embedding may not yet be queryable in the
   vector index — research.md §3).
3. Re-check after the index has had time to update.
4. **Expect**: `"discoverable"` (never a false success/failure — User
   Story 4 #2).

### 5. Batch processing and role enforcement

1. As a Viewer, attempt `POST /api/batches`.
2. **Expect**: 403 (FR-001a).
3. As a Publisher, submit a batch of 51 documents.
4. **Expect**: 422 `BATCH_TOO_LARGE` (FR-011).
5. Submit a batch of 2–3 documents.
6. **Expect**: `GET /api/batches/:batchId` shows independent per-document
   status.

### 6. CLI headless batch run (Principle II)

```bash
npm run cli -- batch-publish --ids doc-123,doc-456 --json
```

**Expect**: same conversion/publish behavior as the UI, JSON output to
stdout, errors to stderr, exit code non-zero on any failure.

## Automated checks

```bash
npm test              # Jest: unit + component (src/lib, src/app)
npm run test:contract  # auth-provider + Google services adapter contracts (Storage/Pub-Sub/Document AI/vector search)
npm run test:e2e       # Playwright across all four views
```
