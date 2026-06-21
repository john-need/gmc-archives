---

description: "Task list for GMC Archive to Open Knowledge Publisher"
---

# Tasks: GMC Archive to Open Knowledge Publisher

**Input**: Design documents from `/specs/001-gmc-okf-ingestion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for every task group — TDD is mandatory here per Constitution Principle III and explicit user request. Every test task MUST be written and confirmed failing before its corresponding implementation task.

**Paradigm note**: Per explicit user request, domain logic favors functional programming: pure functions over classes, immutable data (no in-place mutation), and a "functional core / imperative shell" split — `src/lib/**` pure-function modules contain all business logic and are unit-tested without mocks; `src/backend/**` and CLI commands are the thin imperative shell that performs I/O (Cloud Storage, Pub/Sub, Document AI, vector search, HTTP) and calls into the pure core. Use Ramda for data transformations (`pipe`, `map`, `filter`, etc.) instead of imperative loops where it improves clarity. React components are function components only (no class components); Redux Toolkit reducers stay pure (Immer-backed immutability is acceptable since it preserves the pure-reducer contract).

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4, matching spec.md's user stories. Setup/Foundational/Polish tasks carry no story label.
- File paths are exact, relative to repository root.

## Path Conventions

Per plan.md's Project Structure: `src/lib/**` (framework-agnostic domain library), `src/cli/**`, `src/backend/**` (App Engine service), `src/app/**` (React SPA), `tests/{contract,integration,component,e2e}/**`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling per the user's explicit stack/tooling requirements (research.md §10–§11)

- [ ] T001 Create project directory structure: `src/lib/{auth,conversion,storage,catalog,search}`, `src/cli`, `src/backend/{routes,ingestion,middleware,store}`, `src/app/{routes,components,store,queries}`, `tests/{contract,integration,component,e2e}`
- [ ] T002 Initialize `package.json` with TypeScript, React 18, Redux Toolkit, TanStack Query, Ramda, `react-router-dom`, a minimal Node HTTP framework for `src/backend`, Google Cloud client libraries (Storage, Pub/Sub, Document AI, vector search), Jest, `ts-jest`, `@testing-library/react`, `jest-axe` and `@axe-core/playwright` (constitution §Accessibility), Playwright, ESLint + `@typescript-eslint`
- [ ] T003 [P] Configure `tsconfig.json`: `strict: true`, `noImplicitAny: true`, target ES2020, `paths` mapping `@/*` → `src/*` (research.md §11)
- [ ] T004 [P] Configure `jest.config.ts`: `moduleNameMapper` for `^@/(.*)$` → `<rootDir>/src/$1`, TypeScript transform, separate `jsdom`/`node` test environments for `src/app` vs. `src/lib`/`src/backend`, and `coverageThreshold: { global: { branches: 90, functions: 90, lines: 90, statements: 90 } }` per constitution §"Test First Development" (research.md §11)
- [ ] T005 [P] Configure `.eslintrc.cjs`: `quotes: ["error", "double"]`, `comma-dangle: ["error", "never"]`, `semi: ["error", "always"]`, `curly: ["error", "all"]`, `@typescript-eslint/no-explicit-any: "error"` (research.md §10)
- [ ] T006 [P] Configure `playwright.config.ts` targeting `tests/e2e`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Define shared domain types in `src/lib/types.ts`: `ArchiveDocument`, `OkfRecord`, `CatalogEntry`, `PipelineStatus`, `AttemptRecord`, `Batch`, `User` (data-model.md) — plain immutable interfaces/types, no classes
- [ ] T008 [P] Contract test for the `AuthProvider` interface in `tests/contract/auth-provider.contract.ts`, run against both a fake and a Google-backed implementation (contracts/auth-provider.md) — write first, confirm it fails
- [ ] T009 [P] Contract test for the Google services adapter interfaces (`DocumentStorage`, `IngestionQueue`, `DocumentProcessor`, `SemanticIndex`) in `tests/contract/google-services-adapter.contract.ts` (contracts/google-services-adapter.md) — write first, confirm it fails
- [ ] T010 [P] Contract test for role-enforcement (Viewer → 403 on Publisher-only routes) in `tests/contract/require-role.contract.ts` (FR-001a) — write first, confirm it fails
- [ ] T011 Implement `AuthProvider` interface and `FakeAuthProvider` as pure factory functions (no classes) in `src/lib/auth/authProvider.ts`, `src/lib/auth/fakeAuthProvider.ts` (makes the fake half of T008 pass)
- [ ] T012 Implement `GoogleAuthProvider` backed by Cloud Identity / Google Identity Services in `src/lib/auth/googleAuthProvider.ts` (research.md §6; makes the Google half of T008 pass)
- [ ] T013 [P] Implement fake in-memory `DocumentStorage` in `src/lib/storage/fakeDocumentStorage.ts` (pure data + functions, no hidden mutable singletons beyond an explicit in-memory map passed by the caller)
- [ ] T014 [P] Implement fake in-memory `DocumentProcessor` in `src/lib/conversion/fakeDocumentProcessor.ts`, returning configurable `body`/`author`/`location`/`entities`/`confidence`
- [ ] T015 [P] Implement fake in-memory `IngestionQueue` in `src/backend/ingestion/fakeIngestionQueue.ts`
- [ ] T016 [P] Implement fake in-memory `SemanticIndex` in `src/lib/search/fakeSemanticIndex.ts`, including a configurable "not yet queryable" delay to exercise `isQueryable` (makes T009 pass once T013–T016 are all in place)
- [ ] T017 Implement real Cloud Storage-backed `DocumentStorage` in `src/lib/storage/cloudStorageAdapter.ts` (research.md §1)
- [ ] T018 Implement real Pub/Sub-backed `IngestionQueue` in `src/backend/ingestion/pubsubQueue.ts` (research.md §1–§2)
- [ ] T019 Implement real Document AI-backed `DocumentProcessor` in `src/lib/conversion/documentAiProcessor.ts` (research.md §2)
- [ ] T020 Implement real vector-search-backed `SemanticIndex` in `src/lib/search/vectorSearchIndex.ts` (research.md §3)
- [ ] T021 Implement pure role predicate `canAccess(role, route)` in `src/lib/auth/canAccess.ts`, then a thin Express `requireRole` middleware wrapping it in `src/backend/middleware/requireRole.ts` (FR-001a; makes T010 pass)
- [ ] T022 Implement session middleware wiring `AuthProvider` into requests in `src/backend/middleware/session.ts`, and `GET /api/session` in `src/backend/routes/session.ts` (FR-001b)
- [ ] T023 [P] Scaffold the App Engine backend entry point in `src/backend/app.ts`: wires session + `requireRole` middleware and a structured-JSON error-handling middleware
- [ ] T024 [P] Scaffold the CLI entry point in `src/cli/index.ts` with argument parsing, and a pure `formatOutput(data, mode)` function plus thin stdout/stderr writers in `src/cli/output.ts` (Principle II)
- [ ] T025 [P] Scaffold the React app shell in `src/app/index.tsx` with a `HashRouter` and four route placeholders (browse, batch status, history, catalog search) in `src/app/routes/index.tsx` (FR-012)
- [ ] T026 [P] Scaffold the Redux store (`src/app/store/store.ts`) and TanStack Query client (`src/app/queries/queryClient.ts`)
- [ ] T027 Implement a pure log-entry formatter in `src/lib/logging.ts` plus a thin emitter, wired into backend middleware and the Pub/Sub subscriber so output is consumable by Cloud Monitoring (research.md §7)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Convert an Archive Document to Open Knowledge Format (Priority: P1) 🎯 MVP

**Goal**: A Publisher selects one or more archive documents and converts them into Open Knowledge records, with metadata (including author/location/entities) extracted via the Document AI pipeline.

**Independent Test**: Select one archive document, run conversion through the fakes, and verify a valid `OkfRecord` is produced with metadata intact — independent of whether publishing succeeds afterward.

### Tests for User Story 1 ⚠️ write first, confirm failing

- [ ] T028 [P] [US1] Contract test `GET /api/documents` and `GET /api/documents/:id` in `tests/contract/documents.contract.ts`
- [ ] T029 [P] [US1] Contract test `POST /api/documents/:id/convert` (success, `INCOMPLETE_METADATA`, `UNSUPPORTED_FORMAT`) in `tests/contract/convert.contract.ts`
- [ ] T030 [P] [US1] Contract test `POST /api/batches` including the 50-document cap (FR-011) in `tests/contract/batches.contract.ts`
- [ ] T031 [P] [US1] Integration test: end-to-end conversion through the fakes (upload → queue → process → `OkfRecord` with `author`/`location`/`entities`) in `tests/integration/convert.integration.ts`
- [ ] T032 [P] [US1] Component test for the document browser view (list, select, initiate conversion, missing-metadata error display, keyboard navigation through the list, accessible names/ARIA roles on all interactive elements) in `tests/component/DocumentBrowser.test.tsx` (constitution §Accessibility)

### Implementation for User Story 1

- [ ] T033 [P] [US1] Implement pure `validateMetadata(archiveDocument): { complete: boolean; missingFields: string[] }` in `src/lib/conversion/validateMetadata.ts`
- [ ] T034 [P] [US1] Implement pure `mapExtractionToOkfRecord(archiveDocument, extraction): OkfRecord` in `src/lib/conversion/mapExtractionToOkfRecord.ts` (FR-002, FR-002b)
- [ ] T035 [P] [US1] Implement pure `validateBatchSize(archiveDocumentIds): Result` (max 50) in `src/lib/catalog/validateBatchSize.ts` (FR-011)
- [ ] T036 [US1] Implement the conversion orchestration (imperative shell composing T033/T034 with `DocumentStorage`/`IngestionQueue`/`DocumentProcessor`) in `src/backend/ingestion/conversionHandler.ts` (depends on T033–T034, T013–T014/T017/T019)
- [ ] T037 [US1] Implement batch-creation handling (using T035) in `src/backend/routes/batches.ts` (depends on T035)
- [ ] T038 [US1] Implement `GET /api/documents`, `GET /api/documents/:id`, `POST /api/documents/:id/convert` in `src/backend/routes/documents.ts` (depends on T036)
- [ ] T039 [US1] Implement `GET /api/batches/:batchId` status endpoint in `src/backend/routes/batches.ts` (extends T037's file; depends on T037)
- [ ] T040 [P] [US1] Implement `useDocuments`/`useConvertDocument` TanStack Query hooks in `src/app/queries/useDocuments.ts`
- [ ] T041 [P] [US1] Implement `documentsSlice` (Redux Toolkit) for selection state in `src/app/store/documentsSlice.ts`; actions MUST be plain objects, reducers MUST be pure functions per constitution §Redux — note in a code comment that RTK's Immer-backed draft-mutation syntax is the one documented exception to the no-mutation rule, since it preserves the pure-reducer contract (tasks.md preamble, "Paradigm note")
- [ ] T042 [US1] Implement the `DocumentBrowser` view (function component) in `src/app/routes/DocumentBrowser.tsx` (depends on T040–T041; makes T032 pass)
- [ ] T043 [US1] Implement the `BatchStatusDashboard` view, read-only per-document status list, in `src/app/routes/BatchStatusDashboard.tsx` (depends on T039)
- [ ] T044 [P] [US1] Implement CLI `convert` and `batch-convert` commands in `src/cli/commands/convert.ts` (Principle II; depends on T036–T037)

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Publish a Converted Record to the Knowledge Catalog (Priority: P2)

**Goal**: A Publisher submits a converted record to the Knowledge Catalog, with duplicate-version submissions blocked and corrected republications creating a new version that supersedes the prior one.

**Independent Test**: Take an already-converted `OkfRecord` (created independently of a live conversion run) and publish it; verify the catalog reflects a new entry, a same-version resubmission is blocked, and a corrected republish creates `version 2` while `version 1` becomes `"superseded"`.

### Tests for User Story 2 ⚠️ write first, confirm failing

- [ ] T045 [P] [US2] Contract test `POST /api/documents/:id/publish` (success, `ALREADY_PUBLISHED`, `CATALOG_UNAVAILABLE`) in `tests/contract/publish.contract.ts`
- [ ] T046 [P] [US2] Contract test `POST /api/documents/:id/retry` in `tests/contract/retry.contract.ts`
- [ ] T047 [P] [US2] Integration test: versioning/supersede on republish (publish v1, correct + publish v2, assert v1 `"superseded"`, v2 `"current"`) in `tests/integration/publish-versioning.integration.ts`

### Implementation for User Story 2

- [ ] T048 [P] [US2] Implement pure `publishDecision(existingEntries, newRecord): { action: "publish" | "reject" | "supersede"; ... }` in `src/lib/catalog/publishDecision.ts` (FR-007, FR-007a)
- [ ] T049 [US2] Implement the publish orchestration (imperative shell: persist `CatalogEntry`, call `SemanticIndex.index`) in `src/backend/ingestion/publishHandler.ts` (depends on T048, T016/T020)
- [ ] T050 [US2] Implement `POST /api/documents/:id/publish` and `POST /api/documents/:id/retry` in `src/backend/routes/publish.ts` (depends on T049)
- [ ] T051 [P] [US2] Implement `usePublishDocument`/`useRetryOperation` TanStack Query hooks in `src/app/queries/usePublish.ts`
- [ ] T052 [US2] Wire publish/retry actions into `BatchStatusDashboard` in `src/app/routes/BatchStatusDashboard.tsx` (depends on T051, T043)
- [ ] T053 [P] [US2] Implement CLI `publish` and `batch-publish` commands in `src/cli/commands/publish.ts` (depends on T049)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Query the Knowledge Catalog and Download Source Documents (Priority: P2)

**Goal**: A user runs a natural-language catalog search (optionally narrowed by structured filters) and downloads a result's original source document unchanged.

**Independent Test**: Given records already published, search by a natural-language description of the topic and verify ranked relevant results (and an empty-but-not-error result for an unmatched query); download a result and verify the original format is preserved.

### Tests for User Story 3 ⚠️ write first, confirm failing

- [ ] T054 [P] [US3] Contract test `GET /api/catalog/search` (semantic ranking, structured filters, empty results) in `tests/contract/catalog-search.contract.ts`
- [ ] T055 [P] [US3] Contract test `GET /api/documents/:id/download` (original format preserved, `SOURCE_UNAVAILABLE`) in `tests/contract/download.contract.ts`
- [ ] T056 [P] [US3] Component test for the `CatalogSearch` view (query input, filters, results, empty state, download action, keyboard-operable search/filter controls, accessible names/ARIA roles) in `tests/component/CatalogSearch.test.tsx` (constitution §Accessibility)

### Implementation for User Story 3

- [ ] T057 [P] [US3] Implement pure `applyStructuredFilters(results, filters)` in `src/lib/search/applyFilters.ts` (FR-013)
- [ ] T058 [US3] Implement `semanticSearch` orchestration (query embedding + `SemanticIndex.query` + `applyStructuredFilters`, excluding superseded entries by default) in `src/lib/search/semanticSearch.ts` (depends on T057, T020)
- [ ] T059 [P] [US3] Implement pure `resolveContentType(sourceFormat)` in `src/lib/storage/resolveContentType.ts` (FR-014)
- [ ] T060 [US3] Implement `downloadDocument` orchestration wrapping `DocumentStorage.download` + `resolveContentType` in `src/lib/storage/downloadDocument.ts` (depends on T059, T017)
- [ ] T061 [US3] Implement `GET /api/catalog/search` and `GET /api/documents/:id/download` in `src/backend/routes/catalog.ts` (depends on T058, T060)
- [ ] T062 [P] [US3] Implement `useCatalogSearch`/`useDownloadDocument` hooks in `src/app/queries/useCatalog.ts`
- [ ] T063 [US3] Implement the `CatalogSearch` view in `src/app/routes/CatalogSearch.tsx` (depends on T062; makes T056 pass)
- [ ] T064 [P] [US3] Implement CLI `search` and `download` commands in `src/cli/commands/search.ts` (depends on T058, T060)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently

---

## Phase 6: User Story 4 - Confirm Discoverability via Agent Search (Priority: P3)

**Goal**: A user checks whether a published document has become discoverable via Agent Search, seeing an honest `"pending"` state rather than a false success/failure.

**Independent Test**: Given a record already published, check its discoverability status independent of running a new conversion or publish; verify the state transitions from `"pending"` to `"discoverable"` rather than ever reporting a false result.

### Tests for User Story 4 ⚠️ write first, confirm failing

- [ ] T065 [P] [US4] Contract test `GET /api/documents/:id/discoverability` (`"pending"` → `"discoverable"`) in `tests/contract/discoverability.contract.ts`
- [ ] T066 [P] [US4] Component test for the discoverability status badge (accessible name conveys "pending" vs. "discoverable" to assistive tech, not color alone) in `tests/component/DiscoverabilityBadge.test.tsx` (constitution §Accessibility)

### Implementation for User Story 4

- [ ] T067 [P] [US4] Implement pure `checkDiscoverability(embeddingId)` wrapping `SemanticIndex.isQueryable` in `src/lib/search/checkDiscoverability.ts` (depends on T020)
- [ ] T068 [US4] Implement `GET /api/documents/:id/discoverability` in `src/backend/routes/discoverability.ts` (depends on T067)
- [ ] T069 [P] [US4] Implement `useDiscoverability` hook in `src/app/queries/useDiscoverability.ts`
- [ ] T070 [US4] Implement `DiscoverabilityBadge` component and integrate it into `BatchStatusDashboard` and `CatalogSearch` results in `src/app/components/DiscoverabilityBadge.tsx` (depends on T069; makes T066 pass)
- [ ] T071 [P] [US4] Implement CLI `status` command surfacing discoverability in `src/cli/commands/status.ts` (depends on T067)

**Checkpoint**: All user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: The remaining FR-012 view (publication history, supporting FR-009 across all stories) and quality/operability gates

- [ ] T072 [P] Contract test `GET /api/history` in `tests/contract/history.contract.ts` (FR-009)
- [ ] T073 Implement `GET /api/history` in `src/backend/routes/history.ts` (depends on T072, T007)
- [ ] T074 [P] Implement `useHistory` hook in `src/app/queries/useHistory.ts`
- [ ] T075 Implement the `PublicationHistory` view (the fourth `HashRouter` route) in `src/app/routes/PublicationHistory.tsx` (depends on T074; completes FR-012's four views)
- [ ] T076 [P] Playwright e2e: quickstart.md scenarios 1–4 (convert → publish/version → search/download → discoverability) in `tests/e2e/full-pipeline.spec.ts`
- [ ] T077 [P] Playwright e2e: role enforcement, batch cap, and retry flows (quickstart.md scenario 5) in `tests/e2e/roles-and-batches.spec.ts`
- [ ] T078 [P] Verify Cloud Monitoring-visible structured logs across all backend routes and the Pub/Sub subscriber, with request-id correlation, in `src/backend/middleware/requestLogging.ts` (research.md §7)
- [ ] T079 Security hardening pass: confirm no Google credentials/env secrets are referenced from `src/app`, CORS restricted to the app's own origin, session cookies `httpOnly`/`secure` in `src/backend/app.ts`
- [ ] T080 [P] Accessibility audit across all four views (`DocumentBrowser`, `BatchStatusDashboard`, `CatalogSearch`, `PublicationHistory`): automated `jest-axe`/Playwright-axe scan plus manual keyboard-only navigation and color-contrast check; file and fix any findings (constitution §Accessibility — "regular accessibility audits MUST be conducted")
- [ ] T081 [P] Quality-gate check: run `npm test -- --coverage` and confirm the `coverageThreshold` configured in T004 (≥90% branches/functions/lines/statements) passes; wire this check into the CI/merge gate (constitution §"Test First Development", Development Workflow)
- [ ] T082 Run quickstart.md validation end-to-end against a real or sandboxed Google Cloud project; record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational completion; can proceed in parallel (if staffed) or in priority order P1 → P2 → P2 → P3
- **Polish (Phase 7)**: Depends on all four user stories being complete (the history view surfaces data produced by all of them)

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories
- **User Story 2 (P2)**: Builds on `OkfRecord`s produced by US1, but is independently testable given a pre-made `OkfRecord` fixture
- **User Story 3 (P2)**: Builds on `CatalogEntry`s produced by US2, but is independently testable given pre-published fixtures
- **User Story 4 (P3)**: Builds on `CatalogEntry`s produced by US2, but is independently testable given a pre-published fixture and a fake index

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (Constitution Principle III)
- Pure functions (`src/lib/**`) before the imperative-shell orchestration that calls them
- Orchestration before HTTP routes
- Routes before the React hooks/views that consume them
- CLI commands last, reusing the same orchestration as the routes

### Parallel Opportunities

- All Setup tasks marked [P] can run together
- All Foundational tasks marked [P] can run together once their own prerequisites (if any) are done
- Once Foundational completes, US1–US4 can be staffed in parallel
- Within a story, all [P] test tasks can run together; all [P] pure-function implementation tasks can run together

---

## Parallel Example: User Story 1

```bash
# Tests (write first, run together, confirm all fail):
Task: "Contract test GET /api/documents and GET /api/documents/:id in tests/contract/documents.contract.ts"
Task: "Contract test POST /api/documents/:id/convert in tests/contract/convert.contract.ts"
Task: "Contract test POST /api/batches in tests/contract/batches.contract.ts"
Task: "Integration test conversion pipeline in tests/integration/convert.integration.ts"
Task: "Component test DocumentBrowser in tests/component/DocumentBrowser.test.tsx"

# Pure functions (implement together once tests above are red):
Task: "Implement validateMetadata in src/lib/conversion/validateMetadata.ts"
Task: "Implement mapExtractionToOkfRecord in src/lib/conversion/mapExtractionToOkfRecord.ts"
Task: "Implement validateBatchSize in src/lib/catalog/validateBatchSize.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenario 1 against the fakes
5. Demo conversion in isolation before building publish/search/discoverability

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + User Story 1 → validate independently → MVP
3. + User Story 2 → validate independently (including versioning) → demo
4. + User Story 3 → validate independently (semantic search + download) → demo
5. + User Story 4 → validate independently (discoverability) → demo
6. + Polish (history view, e2e, security, quickstart) → release-ready

---

## Notes

- [P] tasks touch different files and have no unmet dependency within their phase
- [Story] labels map tasks to spec.md's user stories for traceability; Setup/Foundational/Polish carry none
- Functional core (`src/lib/**`) is unit-testable without mocks; only the imperative shell (`src/backend/**`, CLI) needs the fakes from Phase 2
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
