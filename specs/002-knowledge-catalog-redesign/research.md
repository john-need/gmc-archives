# Phase 0 Research: Knowledge Catalog Redesign

Resolves the technical unknowns introduced by spec.md's clarifications, in
the same Decision/Rationale/Alternatives format as feature 001's
research.md, and only for what's new — everything feature 001 already
decided (Cloud Storage, Pub/Sub, Document AI for PDF/scan OCR, vector
search, Cloud Identity auth, ESLint/path-alias config) is unchanged and not
re-litigated here.

## 1. Generative answer synthesis (FR-002, FR-004a)

**Decision**: Use Vertex AI's Gemini models via the `@google-cloud/vertexai`
SDK's `generateContent` call. The backend retrieves grounding documents
via the existing `semanticSearch` (feature 001), then prompts Gemini with
the retrieved snippets and the user's question, instructing it to answer
only from the supplied context and to cite which snippet(s) it used. A new
`GenerativeAnswerModel` interface (`src/lib/search/generativeAnswerModel.ts`)
wraps this so the backend depends on an interface, not the SDK directly —
matching how `SemanticIndex`/`DocumentProcessor` already abstract their
Google services. A `FakeGenerativeAnswerModel` returns a deterministic
templated string referencing the supplied sources, used by the entire test
suite (no live model calls in tests); the real `VertexGenerativeAnswerModel`
is written but, like feature 001's other real adapters, not exercised
against a live project in this pass (no GCP project provisioned).

**Rationale**: Vertex AI is already the project's chosen Google Cloud
surface (Vector Search, Document AI) — adding Gemini through the same
platform avoids a second AI vendor's credentials/SDK. `@google-cloud/vertexai`
is the dedicated SDK for Gemini's chat/generation API (cleaner request/
response shape for this use case than driving it through the lower-level
`@google-cloud/aiplatform` `PredictionServiceClient` already in
package.json, which is used for the Vector Search `MatchService` instead).

**Alternatives considered**:
- *Reuse `@google-cloud/aiplatform`'s generic prediction client for Gemini
  too* — rejected: requires hand-building the Gemini request schema that
  `@google-cloud/vertexai` already provides typed helpers for; no benefit
  to avoiding the extra package for a capability this central to the
  feature.
- *A non-Google LLM provider (e.g., OpenAI)* — rejected: introduces a
  second vendor's credentials/billing/SLA for no stated requirement, and
  contradicts feature 001's established "stay within the Google Cloud
  ecosystem already required" rationale (research.md §5 of feature 001).
- *Extractive-only (no generative call)* — rejected per clarification: the
  user explicitly chose real generative synthesis over templated/extractive
  answers.

## 2. Upload format expansion: Word and spreadsheet text extraction (FR-010a)

**Decision**: Add two new `SourceFormat` values, `"word"` and
`"spreadsheet"`. For these, skip Document AI (it targets OCR/PDF
structure, not native Office XML) and instead extract text directly in
Node using `mammoth` (`.docx` → plain text) and `exceljs` (`.xls`/`.xlsx`/
`.csv` → cell text, sheet-by-sheet). The extracted text feeds the same
`mapExtractionToOkfRecord` pipeline as any other format — author/location/
entity extraction for these two formats is best-effort (often absent from
office documents) and that's an acceptable, already-modeled outcome
(`OkfRecord.author`/`location` are nullable per feature 001's data model).
`isSupportedFormat` and `resolveContentType` (feature 001) both gain the
two new cases.

**Rationale**: `mammoth` and `exceljs` are small, single-purpose, widely-
used libraries with no native-binary/system-dependency footprint — the
smallest addition that does the job, per the project's stated dependency
discipline ("any dependencies introduced MUST be justified by a concrete
feature need"). Routing these formats around Document AI rather than
through it avoids contorting an OCR-oriented service into a role it isn't
designed for.
**Implementation-time substitution**: the original plan named `xlsx`
(SheetJS) for spreadsheet extraction; at implementation time `xlsx`'s npm
releases carried two unpatched CVEs (CVE-2023-30533 prototype pollution,
CVE-2024-22363 regex DoS) with no npm-side fix available. `exceljs` covers
the same `.xls`/`.xlsx`/`.csv` text-extraction need without those CVEs, so
it was substituted before any code was written against `xlsx`.

**Alternatives considered**:
- *Send Word/spreadsheet files to Document AI anyway* — rejected: Document
  AI's processors (OCR, Form Parser, etc.) are not designed for native
  Office Open XML; would require converting to PDF first, adding a
  conversion step and another failure mode for no accuracy benefit over
  direct text extraction.
- *A heavier office-document SDK (e.g., LibreOffice headless conversion)*
  — rejected: large new operational dependency (a renderer process/
  container) for what direct text-extraction libraries handle in-process.
- *Reject Word/spreadsheet uploads entirely, keep four formats* —
  rejected per clarification: the user explicitly chose to expand formats
  to match the design.

## 3. Metadata store extensions: favorites and access requests (FR-007, FR-017–FR-019)

**Decision**: Extend the existing in-memory `MemoryStore`
(`src/backend/store/memoryStore.ts`) with two new maps —
`favorites: Map<string, Set<string>>` (userId → set of archiveDocumentIds)
and `accessRequests: Map<string, AccessRequest>` (keyed by normalized
email) — following the exact pattern feature 001 already established for
`pipelineStatuses`/`batches`/`okfRecords`. Two new library-level interfaces
(`FavoritesStore`, `AccessRequestStore`) wrap these so routes depend on an
interface, not the map shape directly, with fakes for tests. No new
database technology is introduced; this remains consistent with feature
001's posture that the eventual production metadata store (Firestore, per
feature 001 research.md §5) is a deferred provisioning concern, not
something this feature needs to stand up.

**Rationale**: Matches the established codebase pattern exactly (Library-
First interface + fake), keeps this feature's scope to the UI/route layer
it's actually about, and avoids introducing a real database dependency
that the project explicitly hasn't provisioned yet (no GCP project, per
both features' "fakes-only" constraint).

**Alternatives considered**:
- *Stand up a real Firestore connection now* — rejected: no GCP project
  exists to connect to in this environment (same blocker feature 001 hit
  for its real adapters); would be unverifiable scope.
- *Store favorites/access-requests as flat arrays instead of Map/Set* —
  rejected: O(n) duplicate-checking on every favorite-toggle and every
  pending-request-by-email lookup (FR-017's "at most one pending request
  per email") is needless when a `Map`/`Set` gives O(1) for both at no
  extra complexity cost.

## 4. New-document creation from Upload (FR-010)

**Decision**: Add `POST /api/documents` accepting a multipart file plus
minimal metadata (title defaults to the filename minus extension; section/
collection defaults to `"Uploads"` unless the user supplies one). The
handler: (a) infers `sourceFormat` from the file extension via a new pure
`inferSourceFormatFromFilename` function, (b) validates size (FR-010b) and
format (FR-010a) before any upload begins, (c) creates a new
`ArchiveDocument` record (version 1, `metadataComplete: true` since title/
section are always defaulted), (d) uploads the bytes via the existing
`DocumentStorage.upload`, then (e) immediately runs the existing
`attemptConversion` followed by `attemptPublish` — i.e., Upload is convert
+ publish collapsed into one server-driven pipeline behind a single
request, matching the design's single drag-and-drop-to-"indexed" UX
(FR-010) without inventing a third pipeline; it reuses the two
orchestration functions feature 001 already built.

**Rationale**: Feature 001's pipeline (convert → publish) already does
everything Upload needs; the only missing piece is *creating* the
`ArchiveDocument` row in the first place (feature 001 only ever seeded
these, it never had a user-facing "add a new document" path). Chaining the
existing orchestration functions inside one route handler is the smallest
change that satisfies FR-010's "drag-and-drop straight to indexed" outcome.

**Alternatives considered**:
- *Three separate user-visible steps (create, convert, publish)* —
  rejected per spec: the design and FR-010 explicitly describe a single
  drag-and-drop-to-progress-bar experience, not a multi-step wizard.
- *A new, parallel "upload pipeline" independent of convert/publish* —
  rejected: would duplicate logic already in `attemptConversion`/
  `attemptPublish` for no behavioral difference.

## 5. Document viewer modal accessibility (FR-006, constitution Accessibility)

**Decision**: Hand-roll a minimal accessible dialog (`role="dialog"`,
`aria-modal="true"`, labelled by the document title, Escape-to-close,
focus moved to the dialog on open and returned to the trigger on close,
and a basic focus trap via a `keydown` Tab handler) rather than adding a
dialog/modal library.

**Rationale**: The interaction surface is small and well-understood; a
few dozen lines of focus-management code is well within "the simplest
thing that works" territory and avoids a new dependency for a single
component, consistent with the project's dependency-discipline
constraint. `jest-axe` (already a dev dependency) verifies the result
meets WCAG-detectable criteria.

**Alternatives considered**:
- *A dialog library (e.g., Radix UI, Headless UI)* — rejected: one new
  dependency for one component's focus-trap logic is disproportionate;
  revisit only if a second/third modal-like surface emerges with
  materially different requirements.

## 6. Drag-and-drop upload and toast notifications (FR-010, FR-011)

**Decision**: Native HTML5 drag-and-drop events (`onDragOver`/`onDragLeave`/
`onDrop`) and a hand-rolled toast component (a small fixed-position queue
of auto-dismissing messages), matching what feature 001 already does for
similarly small UI concerns (no UI component library was introduced
there either).

**Rationale**: Both are native-platform/few-lines-of-code territory; no
dependency clears the bar of "smallest thing that works."

**Alternatives considered**: None — directly follows the project's
established pattern of preferring native features over new UI
dependencies.

## 7. Ephemeral conversation state in Redux (constitution Redux principle)

**Decision**: A new `conversationSlice` holds `messages`, `draft`, and
`thinking`, mirroring `documentsSlice`'s existing shape/conventions
(plain-object actions, Immer-backed-but-documented-exception reducers).
Nothing about this conversation state is persisted server-side, per the
spec's ephemeral-conversation clarification — the slice's state vanishes
on page reload exactly because Redux state isn't persisted by default,
which is the desired behavior, not an oversight to fix.

**Rationale**: Satisfies the constitution's Redux mandate for client UI
state while staying consistent with the explicit ephemeral-conversation
decision; no new state-management library or persistence layer needed.

**Alternatives considered**:
- *`useState` in the `AskSearch` component instead of Redux* — rejected:
  the constitution requires the Redux pattern for state management: "The
  architecture of the codebase MUST follow the Redux pattern... Any
  deviation... MUST be justified." No such justification applies here —
  this is exactly the ephemeral-client-state case Redux already covers
  for `documentsSlice`.

## 8. "Collection" terminology (FR-005)

**Decision**: No schema change. The Library view's "collection" filter and
label is a presentation-layer rename of `ArchiveDocument.section`
(feature 001's existing field) — confirmed by this feature's spec
Assumptions. `typeFilters`-equivalent logic in the Library view derives
its chip list from the distinct `section` values already present in the
document set.

**Rationale**: Directly specified in spec.md's Assumptions; avoids a
speculative new taxonomy field with no behavioral difference from `section`.

**Alternatives considered**: None — directly specified.
