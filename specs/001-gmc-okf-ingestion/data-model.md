# Phase 1 Data Model: GMC Archive to Open Knowledge Publisher

Entities derived from the feature spec's Key Entities section, expanded
with fields/relationships needed to satisfy the Functional Requirements.
Persisted in the metadata store (research.md §5) unless noted; source
binaries live in Cloud Storage (research.md §1); embeddings live in the
vector index (research.md §3), keyed by `catalogEntryId`.

## ArchiveDocument

Source item from the GMC archive (spec: "Archive Document").

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable source identifier (FR-002) |
| `title` | string | Required (FR-002) |
| `section` | string | GMC section name (FR-002) |
| `date` | ISO date string | Required (FR-002) |
| `sourceFormat` | `"pdf" \| "scanned-image" \| "text"` | Drives OCR path (FR-002a) |
| `storageObjectPath` | string | Cloud Storage object path; new version on republish (FR-007a) |
| `version` | integer | Increments on each republish (FR-007a) |
| `metadataComplete` | boolean | Derived; false triggers the "missing/malformed metadata" acceptance scenario (User Story 1, #2) |

## OkfRecord

Converted representation, ready for Catalog submission (spec: "Open
Knowledge Record").

| Field | Type | Notes |
|---|---|---|
| `id` | string | Generated on conversion |
| `archiveDocumentId` | string | FK → `ArchiveDocument.id` |
| `archiveDocumentVersion` | integer | FK → `ArchiveDocument.version` this record was converted from |
| `title`, `section`, `date`, `sourceIdentifier` | — | Copied from `ArchiveDocument` (FR-002) |
| `body` | string | OCR/extracted text via Document AI for scanned/text sources; native text for PDFs |
| `author` | string \| null | Extracted via Document AI when present (FR-002b) |
| `location` | string \| null | Extracted via Document AI when present (FR-002b) |
| `entities` | string[] | Named entities extracted via Document AI when present (FR-002b) |
| `conversionWarnings` | string[] | Non-fatal issues surfaced to the user (FR-006) |

**Validation**: An `OkfRecord` MUST NOT be created for an `ArchiveDocument`
with `metadataComplete = false` until the missing fields are resolved
(User Story 1, acceptance scenario #2).

## CatalogEntry

Published representation inside the Knowledge Catalog (spec: "Knowledge
Catalog Entry"), versioned.

| Field | Type | Notes |
|---|---|---|
| `catalogEntryId` | string | Identifier assigned on publish (FR-003); stable across versions of the same document |
| `version` | integer | Matches the `OkfRecord`/`ArchiveDocument` version it was published from (FR-007a) |
| `status` | `"current" \| "superseded"` | Only one `"current"` version per `archiveDocumentId` at a time (FR-007a) |
| `okfRecordId` | string | FK → `OkfRecord.id` |
| `archiveDocumentId` | string | FK → `ArchiveDocument.id`; used to enforce one-current-entry-per-source-document (FR-007, SC-005) |
| `publishedAt` | timestamp | |
| `agentSearchDiscoverable` | `"pending" \| "discoverable"` | True once the embedding is confirmed present/queryable in the vector index (research.md §3); never a false success/failure per User Story 4, #2 |
| `embeddingId` | string | Reference into the vector index (research.md §3) |
| `searchableFields` | `{ title, section, date }` | Structured post-filters applied to semantic results (FR-013) |

**Identity rule**: unique on `(archiveDocumentId, version)` — a second
publish attempt for the same `(archiveDocumentId, version)` is rejected
(FR-007); a new `version` for the same `archiveDocumentId` is permitted and
supersedes the prior `"current"` entry (FR-007a).

## PipelineStatus

Lifecycle state for a document moving through the pipeline (spec:
"Pipeline Status").

| Field | Type | Notes |
|---|---|---|
| `archiveDocumentId` | string | FK → `ArchiveDocument.id` |
| `archiveDocumentVersion` | integer | Which version this status applies to |
| `batchId` | string \| null | Groups documents processed together (FR-011); null for single-document operations |
| `stage` | `"imported" \| "converted" \| "publishing" \| "published" \| "discoverable" \| "failed"` | FR-005 |
| `lastError` | string \| null | Populated when `stage = "failed"` (FR-006) |
| `attempts` | `AttemptRecord[]` | Full history for auditing (FR-009) |

### AttemptRecord (nested in `PipelineStatus`)

| Field | Type | Notes |
|---|---|---|
| `attemptedAt` | timestamp | |
| `action` | `"convert" \| "publish"` | |
| `outcome` | `"success" \| "failure"` | |
| `errorDetail` | string \| null | Actionable error text (SC-003) |

## Batch

Grouping of up to 50 `ArchiveDocument`s processed together (FR-011).

| Field | Type | Notes |
|---|---|---|
| `batchId` | string | |
| `archiveDocumentIds` | string[] | `length <= 50`, enforced before submission |
| `createdBy` | `UserId` | FK → `User.id` |
| `createdAt` | timestamp | |

## User

Authenticated principal, resolved via the swappable `AuthProvider`
(research.md §6; FR-001a, FR-001b).

| Field | Type | Notes |
|---|---|---|
| `id` | string | Identity-provider-issued subject ID |
| `role` | `"viewer" \| "publisher"` | FR-001a |
| `identityProvider` | `"google" \| "wordpress"` | Which provider authenticated this session; only `"google"` (via Cloud Identity) is implemented in this feature |

## Relationships

```text
ArchiveDocument (versioned) 1 ── 0..* OkfRecord (one per version) ── 0..1 CatalogEntry (one per version)
ArchiveDocument 1 ── 1 PipelineStatus (current version) ── 0..* AttemptRecord
CatalogEntry versions for one archiveDocumentId: exactly one "current", others "superseded"
Batch 1 ── 1..50 ArchiveDocument
User 1 ── 0..* Batch (createdBy)
CatalogEntry 1 ── 1 embedding (vector index, research.md §3)
```
