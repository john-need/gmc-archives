# Phase 0 Research: GMC Archive to Open Knowledge Publisher

## 1. Overall architecture and credential exposure

**Decision**: Follow Google's recommended architecture for this kind of
searchable archival system: Cloud Storage for source documents, an
App Engine backend serving the SPA's API, Pub/Sub to decouple upload from
processing, Document AI for OCR/text/entity extraction, and a vector index
for semantic catalog search. The React SPA never holds Google service
credentials — it calls only the App Engine backend's own API.

**Rationale**: Confirmed with the user, who shared Google's specific
recommendation for this problem. This also resolves the credential-exposure
concern raised earlier: App Engine is the natural place to hold service
credentials and run multi-step, asynchronous processing that a browser
cannot.

**Alternatives considered**:
- *Generic "thin BFF" with an unspecified Node framework* — superseded:
  the user supplied the actual recommended Google product (App Engine),
  so the backend is now a concrete deployment target rather than an
  unspecified proxy.
- *Synchronous, in-request OCR/indexing on upload* — rejected: Document AI
  processing and embedding/indexing are not guaranteed to complete within a
  single HTTP request; Pub/Sub decouples upload acknowledgment from
  processing, matching FR-005's "imported → converted → published →
  discoverable" pipeline stages.

## 2. Document ingestion pipeline (FR-002, FR-002a, FR-002b, FR-006)

**Decision**: On upload/selection, the backend writes the source file to
Cloud Storage and publishes a message to a Pub/Sub topic. A subscriber
calls Document AI to: (a) OCR scanned images, (b) extract text from PDFs,
(c) extract structured fields (author, location, named entities — FR-002b)
where present. Extraction failures or low-confidence OCR results produce a
`PipelineStatus` of `"failed"` with an actionable error (FR-006), without
discarding the source file in Cloud Storage.

**Rationale**: Document AI directly provides the OCR and structured
extraction capabilities FR-002a/FR-002b require, and is already part of
Google's recommended design. Routing through Pub/Sub means a transient
Document AI failure can be retried (FR-010) without re-uploading the
source file.

**Alternatives considered**:
- *Client-side OCR (e.g., Tesseract.js)* — rejected: lower accuracy on
  archival scans, and the credential/processing model now centers on
  Document AI server-side per the recommended architecture.

## 3. Semantic catalog search (FR-013, SC-007)

**Decision**: After successful extraction, the backend generates an
embedding for each `OkfRecord`'s text and metadata, and indexes it in a
vector search service (e.g., Vertex AI Vector Search, consistent with the
"Vector Search on Gemini Enterprise Agent Platform" naming in the user's
provided architecture). Catalog search (FR-013) converts the user's
natural-language query into an embedding, performs a similarity search
against this index, and applies title/section/date as post-filters on the
ranked results. "Agent Search discoverability" (FR-004, User Story 4) is
reported as `"discoverable"` once a record's embedding is confirmed present
and queryable in the index, `"pending"` until then.

**Rationale**: Directly matches the user-supplied recommended architecture
and satisfies FR-013's semantic-search-as-primary-mode requirement and
SC-007's relevance target, which structured-only filtering could not meet
(e.g., a query like "trail maintenance reports from the 1970s" needs
semantic matching, not exact keyword matching).

**Alternatives considered**:
- *Structured/full-text search only (e.g., simple keyword index)* —
  rejected: cannot satisfy FR-013 as clarified (semantic search is the
  primary mode) or SC-007's relevance target for non-exact-wording queries.

## 4. Versioning and republication (FR-007, FR-007a)

**Decision**: A `CatalogEntry` carries a `version` number and a `status`
of `"current"` or `"superseded"`. Republishing a corrected
`ArchiveDocument` creates a new Cloud Storage object version, a new
`OkfRecord`, and a new `CatalogEntry` version; the metadata store marks the
prior `CatalogEntry` version as `"superseded"` rather than deleting it, and
default search/discoverability results surface only the `"current"`
version unless a user explicitly requests version history.

**Rationale**: FR-007a requires superseded versions to remain accessible
while the latest is surfaced by default — this is a metadata-store
concern (which version is "current") rather than something the vector
index itself needs to track; superseded versions can simply be excluded
from default semantic search results by filtering on `status = "current"`.

**Alternatives considered**:
- *Overwrite in place, no version history* — rejected: explicitly
  contradicts FR-007a and risks losing archival provenance, which conflicts
  with the project's archival-accuracy constitutional constraint.

## 5. Metadata store for pipeline status, history, and catalog metadata

**Decision**: Use a managed document database (e.g., Firestore, staying
within the Google Cloud ecosystem already required for Storage/Pub-Sub/
Document AI) as the `PipelineStore`/`CatalogStore`, holding
`ArchiveDocument`, `OkfRecord`, `CatalogEntry` (with version/supersede
chain), `PipelineStatus`, and `AttemptRecord` documents. The vector index
(Decision 3) stores embeddings only, keyed by `catalogEntryId`, and is
treated as a derived/rebuildable index over this metadata store.

**Rationale**: FR-009 requires audit history across sessions/users, which
must outlive any single request; keeping it in the same cloud ecosystem as
Storage/Pub-Sub/Document AI avoids a second vendor's credentials and
operational surface.

**Alternatives considered**:
- *Derive all status by querying the vector index/Cloud Storage directly*
  — rejected: cannot represent failed/in-progress states (a failed
  conversion never reaches the index at all) or per-batch history
  (FR-009, FR-011).

## 6. Identity-provider abstraction (FR-001a, FR-001b)

**Decision**: Define an `AuthProvider` interface in `src/lib/auth`
(`signIn`, `signOut`, `getCurrentUser`) backed by Cloud Identity /
Google Identity Services for the `GoogleAuthProvider` implementation
today. A `FakeAuthProvider` exists for contract tests proving the interface
is swappable. `WordPressAuthProvider` is designed for but not built in
this feature (FR-001b: the interface must support it; the implementation
is out of scope until the WordPress-embedding feature is built).

**Rationale**: Cloud Identity is the access-control product named in the
user-supplied recommended architecture, fitting directly behind the
abstraction FR-001b already requires.

**Alternatives considered**:
- *Build the WordPress provider now* — rejected: no WordPress plugin shell
  exists yet to integrate against; speculative work the constitution's
  Simplicity principle advises against.

## 7. Operational monitoring

**Decision**: Use Cloud Monitoring to observe the App Engine backend, the
Pub/Sub topic/subscription (lag, failures), and Document AI processor
invocations, per the user-supplied recommended architecture. The library
and backend emit structured logs at each pipeline stage transition (FR-005)
to support this.

**Rationale**: Directly specified in the recommended architecture; gives
operators visibility into where in the pipeline a `"failed"` status
originated without needing to inspect application code.

**Alternatives considered**: None — directly specified.

## 8. Developer tooling for Google Cloud resources

**Decision**: Use Cloud SDK (`gcloud`) for provisioning and managing
Google Cloud resources (Cloud Storage buckets, Pub/Sub topics, Document AI
processors, the vector search index/endpoint), invoked from setup
scripts/CI rather than the application runtime.

**Rationale**: Directly specified in the recommended architecture as the
tool for creating indexes, deploying endpoints, and performing queries
during development/ops.

**Alternatives considered**: None — directly specified.

## 9. Routing within the SPA

**Decision**: `react-router` with `HashRouter`, confirmed directly by the
user, for the four views required by FR-012 (browse, batch status, history,
catalog search).

**Rationale**: Hash-based routing requires no server-side rewrite rules,
which matters both for simple static hosting today and for the future
WordPress-embedded context, where the app's routes must not collide with
WordPress's own URL routing.

**Alternatives considered**:
- *Browser/history router* — rejected for now: requires host-level rewrite
  configuration that a WordPress-embedded deployment cannot easily
  guarantee; can be revisited later per the user's "for now" framing.

## 10. ESLint / TypeScript tooling

**Decision**: ESLint with `@typescript-eslint`, configured for: double
quotes (`quotes: ["error", "double"]`), no trailing commas
(`comma-dangle: ["error", "never"]`), mandatory semicolons
(`semi: ["error", "always"]`), mandatory braces on all `if` statements
(`curly: ["error", "all"]`), and `@typescript-eslint/no-explicit-any: "error"`.
TypeScript `strict: true` with `noImplicitAny: true` reinforces the `any`
ban at the type-checker level, not just the linter.

**Rationale**: Directly specified by the user; documenting the concrete
rule names here so `/speckit-tasks` can generate a setup task with the
exact configuration.

**Alternatives considered**: None — explicit user requirement.

## 11. Path aliasing (`@/src`)

**Decision**: Configure `@/*` → `src/*` in `tsconfig.json` (`paths`) and
mirror it in Jest config (`moduleNameMapper`: `"^@/(.*)$": "<rootDir>/src/$1"`),
using `ts-jest` or `babel-jest` with `@babel/preset-typescript` for
transform.

**Rationale**: Directly specified by the user ("Add paths to both for
@/src folder"); both configs must agree or imports resolve in the app but
fail in tests (or vice versa).

**Alternatives considered**: None — explicit user requirement.
