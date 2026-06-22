# Implementation Plan: Knowledge Catalog Redesign

**Branch**: `002-knowledge-catalog-redesign` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-knowledge-catalog-redesign/spec.md`

## Summary

Refactor the SPA's routes and UI to match the "Google Knowledge Catalog UI"
reference design: a chat-style "Ask & Search" RAG experience (retrieval +
generative answer synthesis with numbered citations) replaces the
structured search form as the primary destination; a redesigned Library
(grid/list, collection filter), a new Favorites view, and a drag-drop
Upload view (replacing the multi-step batch convert/publish UI) round out
four primary destinations behind a persistent side-nav. A fifth surface —
sign-in plus a real, persisted self-service access-request/approval
workflow — replaces today's allowlist-only provisioning. This builds on
top of feature 001's existing `src/lib`/`src/backend`/`src/app` structure
and Google Cloud architecture rather than replacing it: the same
`DocumentStorage`/`DocumentProcessor`/`IngestionQueue`/`SemanticIndex`/
`CatalogStore`/`AuthProvider` interfaces and fakes are reused, extended
only where the new clarified requirements demand it (upload format
expansion, generative answer synthesis, favorites, access requests, Q&A
operational logging).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS — unchanged from feature 001

**Primary Dependencies**: Continues feature 001's stack (React 18, Redux
Toolkit, TanStack Query, Ramda, React Router `HashRouter`, Express,
`@google-cloud/storage`/`pubsub`/`documentai`/`aiplatform`). New for this
feature: `@google-cloud/vertexai` (Gemini `generateContent` for RAG answer
synthesis — decision in research.md §1), `mammoth` (Word `.docx` text
extraction) and `xlsx` (spreadsheet text extraction) for the two upload
formats Document AI's OCR processors don't target (research.md §2)

**Storage**: Unchanged from feature 001 (Cloud Storage for source files;
an in-memory `MemoryStore` stands in for the eventual Firestore metadata
store, extended with `favorites` and `accessRequests` maps — research.md
§3); semantic search embeddings remain in the vector index

**Testing**: Jest + React Testing Library + `jest-axe` (unit/component),
Playwright (e2e), contract tests for every new/extended adapter interface —
unchanged tooling from feature 001

**Target Platform**: Same as feature 001 — App Engine backend + SPA, no new
platform target

**Project Type**: Web application extension — no new top-level project;
all additions land inside the existing `src/lib`, `src/backend`, `src/app`,
`src/cli` structure

**Performance Goals**: Answer perceived-latency <5s (SC-001); document
find-and-open <30s (SC-002); favorite-toggle visual update <1s (SC-006);
access-request review <1min (SC-007) — all from spec.md Success Criteria

**Constraints**: No client-side exposure of Google service credentials
(unchanged); 50MB per-file upload cap (FR-010b); Library renders its full
filtered set without pagination (clarified out of scope); no Ask & Search
rate limiting in this feature (clarified out of scope); document
visibility is uniform across roles — no per-document ACLs (FR-013)

**Scale/Scope**: Same small trusted user base as feature 001; five user
destinations (Ask & Search, Library, Favorites, Upload, Sign-in/Request
Access) plus an Editor-only access-request review surface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applied as |
|---|---|
| I. Library-First | New domain logic lands in `src/lib`: `src/lib/search/composeAnswer.ts` (generative synthesis), `src/lib/favorites/` (toggle/list logic + store interface + fake), `src/lib/access/` (request/approve/deny decision logic + store interface + fake), `src/lib/conversion/` gains format-detection and Word/spreadsheet extraction — all framework-agnostic, independently unit-tested, consumed by `src/backend` and (where applicable) `src/cli`. |
| II. CLI Interface | New CLI commands wrap the new library/backend capabilities headlessly: `ask`, `favorite`/`unfavorite`, `request-access`, `review-requests` — same stdin/args → stdout, errors → stderr, `--json` contract as feature 001's commands. |
| III. Test-First (NON-NEGOTIABLE) | Every new pure function, adapter, route, and component gets a contract/unit/component test written and confirmed failing before implementation, per tasks.md ordering — unchanged discipline from feature 001. |
| IV. Integration Testing | New adapter interfaces (`GenerativeAnswerModel`, `FavoritesStore`, `AccessRequestStore`) each get a contract test run against a fake (and, where a real Google-backed implementation is written, against that too) — same pattern as feature 001's `google-services-adapter.contract.ts`. |
| V. Observability, Versioning & Simplicity | FR-004b's structured Q&A logging reuses `src/lib/logging.ts` (no new logging mechanism); no speculative second generative-model vendor, no new persistence technology, no rate-limiting/pagination scaffolding (both explicitly out of scope per clarification) — YAGNI held to. |
| VI. Functional Programming Paradigm | `composeAnswer`, favorite/access-request decision logic, and format-detection are pure functions; side effects (model calls, store I/O) stay in the imperative shell (`src/backend`), matching feature 001's functional-core/imperative-shell split. |
| Redux | The only new Redux slice is `conversationSlice` (ephemeral chat thread state — messages, draft, thinking flag — per the clarified "ephemeral, client-only" conversation scope); favorites/access-requests are server-authoritative and managed via TanStack Query, consistent with how feature 001 already treats `OkfRecord`/`CatalogEntry` server state (no Redux duplication of server state). |
| Ramda | List/filter/grouping logic in the Library view (collection filtering, free-text matching) and favorites list derivation uses Ramda (`filter`, `pipe`, `groupBy`) rather than hand-rolled loops, matching feature 001's existing usage. |
| Test First Development | Same red-green-refactor discipline and ≥90% coverage gate as feature 001 (T081's gate is re-run, not re-defined, against the larger surface). |
| Accessibility | The new chat thread (live "searching"/error states), drag-drop Upload zone, document-viewer modal, and toast pattern each need their own audit pass beyond feature 001's four original views — called out explicitly in tasks.md's Polish phase rather than assumed. |
| Naming Conventions | New files continue the kebab-case-deviating camelCase convention feature 001 already established project-wide (e.g., `composeAnswer.ts`, not `compose-answer.ts`). This is a pre-existing, project-wide deviation from the constitution's stated kebab-case rule, not a new one introduced by this feature; introducing kebab-case only for new files would split the codebase into two inconsistent conventions, a worse outcome than the existing uniform (if non-compliant) one. Flagged here for visibility, not re-justified per-file. |

No unjustified violations — see Complexity Tracking for the one deliberate
deviation (the naming-convention note above) and its rationale.

## Project Structure

### Documentation (this feature)

```text
specs/002-knowledge-catalog-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── auth/                       # unchanged from 001
│   ├── access/                     # NEW: access-request domain
│   │   ├── accessRequestStore.ts        # interface
│   │   ├── fakeAccessRequestStore.ts
│   │   └── accessRequestDecision.ts     # pure: submit/approve/deny rules
│   ├── conversion/
│   │   ├── inferSourceFormatFromFilename.ts   # NEW: extension → SourceFormat
│   │   ├── wordTextExtractor.ts               # NEW: mammoth-backed
│   │   ├── spreadsheetTextExtractor.ts        # NEW: xlsx-backed
│   │   └── (existing files unchanged)
│   ├── storage/                    # unchanged from 001
│   ├── catalog/                    # unchanged from 001
│   ├── favorites/                  # NEW: favorites domain
│   │   ├── favoritesStore.ts            # interface
│   │   ├── fakeFavoritesStore.ts
│   │   └── toggleFavorite.ts            # pure decision
│   └── search/
│       ├── generativeAnswerModel.ts      # NEW: interface (Gemini call)
│       ├── fakeGenerativeAnswerModel.ts  # NEW
│       ├── vertexGenerativeAnswerModel.ts # NEW: real adapter (research.md §1)
│       ├── composeAnswer.ts              # NEW: pure orchestration of retrieval+generation shape
│       └── (existing files unchanged)
├── backend/
│   ├── routes/
│   │   ├── ask.ts                  # NEW: POST /api/ask
│   │   ├── favorites.ts            # NEW: GET/POST/DELETE /api/favorites
│   │   ├── accessRequests.ts       # NEW: submit + Editor review endpoints
│   │   ├── documents.ts            # EXTENDED: POST /api/documents (create-from-upload)
│   │   └── (existing files unchanged)
│   ├── middleware/                 # unchanged from 001
│   ├── ingestion/                  # unchanged from 001
│   └── store/
│       └── memoryStore.ts          # EXTENDED: + favorites, accessRequests maps
├── app/
│   ├── routes/
│   │   ├── AskSearch.tsx           # NEW: chat-style primary view
│   │   ├── Library.tsx             # NEW: replaces DocumentBrowser's role
│   │   ├── Favorites.tsx           # NEW
│   │   ├── Upload.tsx              # NEW: replaces batch convert/publish UI
│   │   ├── SignIn.tsx              # NEW
│   │   ├── RequestAccess.tsx       # NEW
│   │   ├── AccessRequestReview.tsx # NEW: Editor-only
│   │   └── index.tsx               # EXTENDED: new route wiring
│   ├── components/
│   │   ├── DocumentViewerModal.tsx # NEW
│   │   ├── Toast.tsx               # NEW
│   │   ├── SideNav.tsx             # NEW
│   │   └── DiscoverabilityBadge.tsx # unchanged from 001
│   ├── store/
│   │   ├── conversationSlice.ts    # NEW: ephemeral chat thread state
│   │   └── (existing files unchanged)
│   └── queries/
│       ├── useAsk.ts               # NEW
│       ├── useFavorites.ts         # NEW
│       ├── useAccessRequests.ts    # NEW
│       └── (existing files unchanged)
└── cli/commands/
    ├── ask.ts                      # NEW
    ├── favorite.ts                 # NEW
    └── access.ts                   # NEW: request-access, review-requests

tests/
├── contract/    # + access-request-store, favorites-store, generative-answer-model contracts
├── integration/ # + ask flow, upload-creates-document flow, access-request approval flow
├── component/   # + AskSearch, Library, Favorites, Upload, DocumentViewerModal, SignIn/RequestAccess
└── e2e/         # + full ask/upload/favorite/access-request flows
```

**Structure Decision**: Pure extension of feature 001's existing
single-`src/` web-application structure (no new top-level directories).
Each new capability gets its own `src/lib/<domain>/` folder following the
established `interface` + `fakeXStore`/`fakeXModel` + real-adapter pattern
(`access/`, `favorites/`), or a new file inside an existing domain folder
where it's a natural extension (`conversion/`, `search/`). Backend routes
and React routes/components/queries follow the same per-file conventions
feature 001 already uses.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Continuing camelCase file names (constitution states kebab-case) | Feature 001 already established camelCase project-wide; this feature adds ~25 new files | Switching only new files to kebab-case would produce a codebase with two inconsistent naming conventions live side-by-side — worse than the existing uniform-but-noncompliant state. A repo-wide rename is out of scope for this feature and would be pure churn unrelated to the UI redesign being requested. |
