---

description: "Task list for Knowledge Catalog Redesign"
---

# Tasks: Knowledge Catalog Redesign

**Input**: Design documents from `/specs/002-knowledge-catalog-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for every task group — TDD is mandatory per Constitution Principle III, continuing feature 001's established discipline. Every test task MUST be written and confirmed failing before its corresponding implementation task.

**Paradigm note**: Continues feature 001's functional-core/imperative-shell split. New pure logic (`buildGroundingSources`, `deriveCollections`, `toggleFavorite`, `accessRequestDecision`, `validateUploadFile`, `inferSourceFormatFromFilename`) lives in `src/lib/**` and is unit-tested without mocks; new I/O (`askHandler`, `uploadHandler`, the new routes, the real Vertex/mammoth/exceljs adapters) is the thin imperative shell. `conversationSlice` is the one new Redux slice (ephemeral client-only chat state); favorites and access requests are server-authoritative and managed via TanStack Query, matching how feature 001 already treats `CatalogEntry`/`OkfRecord` server state — no Redux duplication of server state. Ramda is used for the new list/derivation logic (`deriveCollections`).

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P3) to enable independent implementation and testing of each story, exactly as feature 001's tasks.md does.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5, matching spec.md's user stories. Setup/Foundational/Polish tasks carry no story label.
- File paths are exact, relative to repository root.

## Path Conventions

Extends feature 001's existing structure — no new top-level directories.
`src/lib/{favorites,access}/**` are the two new domain folders; everything
else is new files inside `src/lib/{conversion,search}`, `src/backend/{routes,ingestion,store}`,
`src/app/{routes,components,store,queries}`, `src/cli/commands`, and
`tests/{contract,integration,component,unit,e2e}` (continuing feature 001's
test layout, with `tests/unit/` for pure-function tests as already
established there).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New dependencies this feature needs beyond feature 001's stack (research.md §1–§2, contracts/bff-api.md's multipart upload)

- [X] T001 Add `@google-cloud/vertexai`, `mammoth`, `exceljs`, `multer` to `package.json` dependencies and `@types/multer` to devDependencies (substituted `exceljs` for the originally planned `xlsx` after discovering unpatched CVEs — research.md §2)
- [X] T002 `npm install`; confirm `npm run typecheck` and `npm run lint` still pass against feature 001's existing code with no changes yet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capabilities shared by three or more user stories (Favorites is used from Ask & Search, Library, and the Favorites view itself; the app shell/nav, toast, and document viewer are used across nearly every view)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Define `Favorite` and `AccessRequest` types in `src/lib/types.ts` (data-model.md)
- [X] T004 [P] Implement `FavoritesStore` interface in `src/lib/favorites/favoritesStore.ts` (contracts/favorites-store.md)
- [X] T005 [P] Contract test for `FavoritesStore` in `tests/contract/favorites-store.contract.ts` (contracts/favorites-store.md) — write first, confirm it fails
- [X] T006 Implement `fakeFavoritesStore` in `src/lib/favorites/fakeFavoritesStore.ts` (makes T005 pass; depends on T004)
- [X] T007 Extend `MemoryStore` with a `favorites: Map<string, Set<string>>` map in `src/backend/store/memoryStore.ts` (data-model.md)
- [X] T008 [P] Implement pure `toggleFavorite(isFavorited): { action: "add" | "remove" }` decision in `src/lib/favorites/toggleFavorite.ts`
- [X] T009 [P] Contract test for `GET/POST/DELETE /api/favorites` in `tests/contract/favorites.contract.ts` (contracts/bff-api.md) — write first, confirm it fails
- [X] T010 Implement favorites routes in `src/backend/routes/favorites.ts` (makes T009 pass; depends on T006–T008)
- [X] T011 [P] Implement `useFavorites` TanStack Query hooks (list/add/remove) in `src/app/queries/useFavorites.ts`
- [X] T012 [P] Implement `Toast` component (local-state, auto-dismissing message queue per FR-011) in `src/app/components/Toast.tsx`
- [X] T013 [P] Implement accessible `DocumentViewerModal` component (`role="dialog"`, focus trap, Escape-to-close per research.md §5; degrades to a "no longer available" state rather than erroring if its document is missing/deleted, per spec.md edge cases) in `src/app/components/DocumentViewerModal.tsx`
- [X] T014 [P] Implement `SideNav` component (Ask & Search / Library / Favorites / permission-gated Upload, user name + role label, sign-out) in `src/app/components/SideNav.tsx`
- [X] T015 Rewire `src/app/routes/index.tsx`: mount `SideNav` as the persistent app shell and add route placeholders for `AskSearch` (default), `Library`, `Favorites`, `Upload`, `SignIn`, `RequestAccess`, `AccessRequestReview` (depends on T014)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Ask the Archive a Question (Priority: P1) 🎯 MVP

**Goal**: A signed-in user asks a plain-language question and receives a generative, grounded answer with numbered source citations, matching the chat-style design.

**Independent Test**: Sign in, ask a question (from a suggested prompt or typed), and verify a grounded answer with at least one openable, numbered source appears — independent of Library, Favorites, or Upload.

### Tests for User Story 1 ⚠️ write first, confirm failing

- [X] T016 [P] [US1] Contract test for `GenerativeAnswerModel` in `tests/contract/generative-answer-model.contract.ts` (contracts/generative-answer-model.md)
- [X] T017 [P] [US1] Contract test `POST /api/ask` (success with sources, empty-sources best-effort answer, `ASK_FAILED`) in `tests/contract/ask.contract.ts` (contracts/bff-api.md)
- [X] T018 [P] [US1] Integration test: end-to-end ask through the fakes (retrieval → generation → citations → `QaLogEntry` emitted per FR-004b) in `tests/integration/ask.integration.ts`
- [X] T019 [P] [US1] Component test for the `AskSearch` view (welcome state + suggested prompts, send, sources panel, "New chat", inline error + retry, keyboard operability, ARIA roles, and that submitting a second question while `thinking` is true is blocked/queued rather than interleaving two answers — spec.md edge case) in `tests/component/AskSearch.test.tsx` (constitution §Accessibility)

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement `GenerativeAnswerModel` interface in `src/lib/search/generativeAnswerModel.ts` (contracts/generative-answer-model.md)
- [X] T021 [P] [US1] Implement `fakeGenerativeAnswerModel` in `src/lib/search/fakeGenerativeAnswerModel.ts` (deterministic output per source set; makes T016 pass)
- [X] T022 [P] [US1] Implement pure `buildGroundingSources(catalogEntries, okfRecords): GroundingSource[]` in `src/lib/search/buildGroundingSources.ts`
- [X] T023 [US1] Implement `askHandler` orchestration (semanticSearch → buildGroundingSources → model.generate → emit `QaLogEntry` via `emitLogEntry` → shape `{answer, sources}`; catches model/retrieval failure → `ASK_FAILED`) in `src/backend/ingestion/askHandler.ts` (depends on T020–T022)
- [X] T024 [US1] Implement `POST /api/ask` route in `src/backend/routes/ask.ts` (makes T017 pass; depends on T023)
- [X] T025 [P] [US1] Implement `conversationSlice` (Redux: `messages`, `draft`, `thinking`; the `send` action/thunk is a no-op while `thinking` is already true, guaranteeing no interleaved answers) in `src/app/store/conversationSlice.ts`
- [X] T026 [P] [US1] Implement `useAsk` TanStack Query mutation hook in `src/app/queries/useAsk.ts`
- [X] T027 [US1] Implement the `AskSearch` view (function component) in `src/app/routes/AskSearch.tsx` (depends on T025–T026, T012–T013; makes T019 pass)
- [X] T028 [US1] Wire `AskSearch` as the default route in `src/app/routes/index.tsx` (depends on T015, T027)
- [X] T029 [P] [US1] Implement real `vertexGenerativeAnswerModel` in `src/lib/search/vertexGenerativeAnswerModel.ts` (research.md §1; not exercised against a live project in this pass)
- [X] T030 [P] [US1] Implement CLI `ask` command in `src/cli/commands/ask.ts` (Principle II)

**Checkpoint**: User Story 1 is fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Browse and Filter the Library (Priority: P1)

**Goal**: A signed-in user browses the full catalog, filters by collection and free text, switches grid/list layout, and opens/downloads/favorites any document — independent of asking a question first.

**Independent Test**: Sign in, go to Library, filter to one collection, switch view modes, and open/download/favorite a document — independent of Ask & Search or Favorites.

### Tests for User Story 2 ⚠️ write first, confirm failing

- [X] T031 [P] [US2] Unit test for `deriveCollections` in `tests/unit/deriveCollections.test.ts`
- [X] T032 [P] [US2] Component test for the `Library` view (free-text + collection filtering, grid/list toggle, view/favorite actions, no-results state, keyboard operability, ARIA roles, and that the download action requests the document's original format/content-type unchanged per FR-015) in `tests/component/Library.test.tsx` (constitution §Accessibility)

### Implementation for User Story 2

- [X] T033 [P] [US2] Implement pure `deriveCollections(documents): string[]` (Ramda `pipe`/`uniq`/`sortBy`) in `src/lib/catalog/deriveCollections.ts` (makes T031 pass)
- [X] T034 [US2] Implement the `Library` view in `src/app/routes/Library.tsx` (uses existing `useDocuments`, `useFavorites` from T011, `DocumentViewerModal` from T013, `deriveCollections`) (depends on T033; makes T032 pass)
- [X] T035 [US2] Wire `Library` into `src/app/routes/index.tsx` (depends on T015, T034)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Save and Revisit Favorites (Priority: P2)

**Goal**: A signed-in user bookmarks documents from anywhere they appear and revisits them from a dedicated Favorites view.

**Independent Test**: From Library, favorite a document, navigate to Favorites, confirm it appears, unfavorite it, confirm it disappears — independent of Ask & Search or Upload.

### Tests for User Story 3 ⚠️ write first, confirm failing

- [X] T036 [P] [US3] Integration test: favorite from Library, appears in Favorites, unfavorite removes it, in `tests/integration/favorites.integration.ts`
- [X] T037 [P] [US3] Component test for the `Favorites` view (list, empty state with link back to Library, accessibility, and that the download action requests the document's original format/content-type unchanged per FR-015) in `tests/component/Favorites.test.tsx` (constitution §Accessibility)

### Implementation for User Story 3

- [X] T038 [US3] Implement the `Favorites` view in `src/app/routes/Favorites.tsx` (depends on T011, T013; makes T037 pass)
- [X] T039 [US3] Wire `Favorites` into `src/app/routes/index.tsx` (depends on T015, T038)
- [X] T040 [P] [US3] Implement CLI `favorite`/`unfavorite` commands in `src/cli/commands/favorite.ts` (Principle II)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently

---

## Phase 6: User Story 4 - Publish New Documents into the Catalog (Priority: P2)

**Goal**: A permitted user drags a file onto the Upload view (or browses for one) and sees it progress to "indexed," after which it's immediately in the Library and answerable from Ask & Search.

**Independent Test**: As a permitted user, drag a file onto Upload, watch progress reach "indexed," confirm it now appears in Library and is answerable — independent of Favorites or any prior conversion state.

### Tests for User Story 4 ⚠️ write first, confirm failing

- [X] T041 [P] [US4] Unit test for `inferSourceFormatFromFilename` in `tests/unit/inferSourceFormatFromFilename.test.ts`
- [X] T042 [P] [US4] Unit test for `wordTextExtractor` (mocked `mammoth`) in `tests/unit/wordTextExtractor.test.ts`
- [X] T043 [P] [US4] Unit test for `spreadsheetTextExtractor` (mocked `exceljs`) in `tests/unit/spreadsheetTextExtractor.test.ts`
- [X] T044 [P] [US4] Unit test for `validateUploadFile` (format + 50MB size checks, FR-010a/FR-010b) in `tests/unit/validateUploadFile.test.ts`
- [X] T045 [P] [US4] Contract test `POST /api/documents` (success incl. `.docx`/`.csv`, `UNSUPPORTED_FORMAT`, `FILE_TOO_LARGE`, `CONVERSION_FAILED`/`CATALOG_UNAVAILABLE` passthrough) in `tests/contract/upload.contract.ts` (contracts/bff-api.md)
- [X] T046 [P] [US4] Integration test: upload a `.docx` and a `.csv` end-to-end through the fakes, verify visible in Library and answerable from Ask & Search, in `tests/integration/upload.integration.ts`
- [X] T047 [P] [US4] Component test for the `Upload` view (drag states, per-file progress to indexed, format/size rejection messages, hidden entirely for non-permitted users, accessibility) in `tests/component/Upload.test.tsx` (constitution §Accessibility)

### Implementation for User Story 4

- [X] T048 [P] [US4] Extend `SourceFormat` union with `"word" | "spreadsheet"` in `src/lib/types.ts` (data-model.md)
- [X] T049 [US4] Update `isSupportedFormat` for the two new formats in `src/lib/conversion/isSupportedFormat.ts` (depends on T048)
- [X] T050 [US4] Update `resolveContentType` for the two new formats in `src/lib/storage/resolveContentType.ts` (depends on T048)
- [X] T051 [P] [US4] Implement pure `inferSourceFormatFromFilename(filename): SourceFormat | null` in `src/lib/conversion/inferSourceFormatFromFilename.ts` (makes T041 pass)
- [X] T052 [P] [US4] Implement `wordTextExtractor` (`mammoth`-backed) in `src/lib/conversion/wordTextExtractor.ts` (makes T042 pass)
- [X] T053 [P] [US4] Implement `spreadsheetTextExtractor` (`exceljs`-backed) in `src/lib/conversion/spreadsheetTextExtractor.ts` (makes T043 pass)
- [X] T054 [P] [US4] Implement pure `validateUploadFile({ filename, sizeBytes }): Result` in `src/lib/conversion/validateUploadFile.ts` (makes T044 pass)
- [X] T055 [US4] Update the real `documentAiProcessor` to branch `"word"`/`"spreadsheet"` to the new extractors, else keep the existing Document AI path, in `src/lib/conversion/documentAiProcessor.ts` (depends on T052–T053)
- [X] T056 [US4] Implement `uploadHandler` orchestration (`validateUploadFile` → create `ArchiveDocument` → `DocumentStorage.upload` → `attemptConversion` → `attemptPublish`) in `src/backend/ingestion/uploadHandler.ts` (depends on T049–T051, T054–T055)
- [X] T057 [US4] Implement `POST /api/documents` (multipart via `multer`, Publisher/Editor-only) in `src/backend/routes/documents.ts` (makes T045 pass; depends on T056)
- [X] T058 [P] [US4] Implement `useUpload` hook (XHR-based, for upload-progress events) in `src/app/queries/useUpload.ts`
- [X] T059 [US4] Implement the `Upload` view in `src/app/routes/Upload.tsx` (drag-drop, per-file progress, indexed state, toast on completion via T012) (depends on T058; makes T047 pass)
- [X] T060 [US4] Wire `Upload` into `src/app/routes/index.tsx` and gate its `SideNav` entry to permitted users (depends on T014, T015, T059)
- [X] T061 [P] [US4] Implement CLI `upload` command in `src/cli/commands/upload.ts` (Principle II — also usable for bulk-importing the `GMC-Newsletter-List.md` backlog)

**Checkpoint**: User Stories 1, 2, 3, AND 4 all work independently

---

## Phase 7: User Story 5 - Sign In and Request Access (Priority: P3)

**Goal**: An unprovisioned visitor signs in or submits a request-access form; an Editor reviews and approves/denies pending requests; approval provisions a new Researcher.

**Independent Test**: As an unprovisioned visitor, submit a valid request-access form and confirm submission; separately, as an Editor, confirm the same request is visible and can be approved or denied — independent of any other authenticated-area functionality.

### Tests for User Story 5 ⚠️ write first, confirm failing

- [X] T062 [P] [US5] Contract test for `AccessRequestStore` in `tests/contract/access-request-store.contract.ts` (contracts/access-request-store.md)
- [X] T063 [P] [US5] Contract test for access-request routes (submit, Editor-only list returns 403 for Researcher, approve, deny, validation errors, dedupe-while-pending, resubmit-after-denial) in `tests/contract/access-requests.contract.ts` (contracts/bff-api.md)
- [X] T064 [P] [US5] Integration test: request → approve → sign-in succeeds as Researcher; request → deny → sign-in routes back to request-access, in `tests/integration/access-request-approval.integration.ts`
- [X] T065 [P] [US5] Component test for `SignIn`/`RequestAccess` views (Google sign-in trigger, form validation, submitted confirmation, accessibility) in `tests/component/SignIn.test.tsx` (constitution §Accessibility)
- [X] T066 [P] [US5] Component test for the Editor-only `AccessRequestReview` view (pending list, approve/deny actions, accessibility) in `tests/component/AccessRequestReview.test.tsx` (constitution §Accessibility)

### Implementation for User Story 5

- [X] T067 [P] [US5] Implement `AccessRequestStore` interface in `src/lib/access/accessRequestStore.ts` (contracts/access-request-store.md)
- [X] T068 [P] [US5] Implement `fakeAccessRequestStore` in `src/lib/access/fakeAccessRequestStore.ts` (makes T062 pass; depends on T067)
- [X] T069 [P] [US5] Implement pure `accessRequestDecision` helpers (submission validation; approve/deny transition rules) in `src/lib/access/accessRequestDecision.ts`
- [X] T070 Extend `MemoryStore` with `accessRequests` and `provisionedUsers` maps in `src/backend/store/memoryStore.ts` (data-model.md)
- [X] T071 [P] [US5] Implement `UserDirectory` interface in `src/lib/access/userDirectory.ts`
- [X] T072 [P] [US5] Implement `fakeUserDirectory` (Map-backed) in `src/lib/access/fakeUserDirectory.ts` (depends on T071)
- [X] T073 Update `fakeAuthProvider` to accept an optional `userDirectory` for role resolution, falling back to its existing static-role behavior when absent (backward-compatible with all feature 001 tests) in `src/lib/auth/fakeAuthProvider.ts` (depends on T071)
- [X] T074 Update `googleAuthProvider` to accept an optional `userDirectory` for role resolution, falling back to its existing `roleAllowlist` behavior when absent, in `src/lib/auth/googleAuthProvider.ts` (depends on T071)
- [X] T075 Implement access-request routes (`POST /api/access-requests` unauthenticated; `GET` + approve/deny Editor-only via `requireRole`) in `src/backend/routes/accessRequests.ts` — approving calls `userDirectory.provision` (makes T063 pass; depends on T068–T069, T072)
- [X] T076 Wire `fakeUserDirectory`/`fakeAccessRequestStore` into `src/backend/app.ts` and `src/backend/server.ts` (depends on T073–T075)
- [X] T077 [P] [US5] Implement `useAccessRequests` hooks (submit, list pending, approve, deny) in `src/app/queries/useAccessRequests.ts`
- [X] T078 [US5] Implement the `SignIn` view in `src/app/routes/SignIn.tsx` (depends on T077; makes the sign-in half of T065 pass)
- [X] T079 [US5] Implement the `RequestAccess` view (form, validation, confirmation) in `src/app/routes/RequestAccess.tsx` (depends on T077; makes the rest of T065 pass)
- [X] T080 [US5] Implement the Editor-only `AccessRequestReview` view in `src/app/routes/AccessRequestReview.tsx` (depends on T077; makes T066 pass)
- [X] T081 [US5] Wire `SignIn`/`RequestAccess`/`AccessRequestReview` into `src/app/routes/index.tsx`, redirecting unauthenticated visitors to `SignIn` (depends on T015, T078–T080)
- [X] T082 [P] [US5] Implement CLI `request-access`/`review-requests` commands in `src/cli/commands/access.ts` (Principle II)

**Checkpoint**: All five user stories are independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and quality gates across all five stories

- [X] T083 [P] Playwright e2e: ask → upload → favorite → access-request-approval full pipeline, in `tests/e2e/knowledge-catalog-redesign.spec.ts`
- [X] T084 [P] Playwright e2e: a Researcher cannot see/reach Upload or Access Request Review; an Editor can, in `tests/e2e/role-gating.spec.ts`
- [X] T085 Accessibility audit across every new view and component (`AskSearch`, `Library`, `Favorites`, `Upload`, `SignIn`, `RequestAccess`, `AccessRequestReview`, `DocumentViewerModal`, `Toast`, `SideNav`): automated `jest-axe`/Playwright-axe scan plus manual keyboard-only navigation; file and fix any findings (constitution §Accessibility)
- [X] T086 Security hardening pass: confirm the 50MB upload limit is enforced server-side (not only client-side), confirm Editor-only routes return 403 (not 200) for a Researcher session, confirm access-request name/email never appears in client-visible logs (only structured server logs)
- [X] T087 Quality-gate check: run `npm run test:coverage`, confirm the ≥90% threshold passes against the larger codebase; extend `jest.config.ts`'s `collectCoverageFrom` exclusions only for `vertexGenerativeAnswerModel.ts` (consistent with feature 001's treatment of its other un-credentialed real adapters)
- [X] T088 Run quickstart.md validation end-to-end against the fakes (and, if a GCP project becomes available, against the real Vertex AI Gemini integration)
- [X] T089 [P] Integration test: superseded document versions (FR-007a/FR-016 of feature 001, preserved here) are excluded by default from Library (T034), Favorites (T038), and Ask & Search (T024) results, in `tests/integration/version-filtering.integration.ts` — covers a gap identified by `/speckit-analyze` (FR-016 had no explicit re-verification under the new UI)
- [X] T090 [P] Integration test: downloading the same document from the Library (T034), the document viewer (T013), and the Ask & Search Sources panel (T027) all return the original format/content-type unchanged (FR-015), in `tests/integration/cross-surface-download.integration.ts` — covers a gap identified by `/speckit-analyze`
- [X] T091 [P] Component test: `DocumentViewerModal` (T013) shows a "no longer available" state, not an error, when opened for a document that has since been deleted (spec.md edge case), in `tests/component/DocumentViewerModal.test.tsx` — covers a gap identified by `/speckit-analyze`; `DocumentViewerModal` had no dedicated test task despite being Foundational/shared by three stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational completion; can proceed in parallel (if staffed) or in priority order P1 → P1 → P2 → P2 → P3
- **Polish (Phase 8)**: Depends on all five user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories beyond Foundational
- **User Story 2 (P1)**: No dependency on other stories beyond Foundational; independently testable even though it shares `useFavorites`/`DocumentViewerModal` with US1/US3
- **User Story 3 (P2)**: Builds on documents favorited via US1/US2's UI, but is independently testable given a pre-favorited fixture
- **User Story 4 (P2)**: No dependency on other stories beyond Foundational; produces `ArchiveDocument`s that US1/US2/US3 can subsequently exercise, but does not require them
- **User Story 5 (P3)**: No dependency on other stories beyond Foundational; the `userDirectory` change to the two `AuthProvider` implementations is additive/backward-compatible, so it cannot break US1–US4's existing sign-in-based tests

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (Constitution Principle III)
- Pure functions (`src/lib/**`) before the imperative-shell orchestration that calls them
- Orchestration before HTTP routes
- Routes before the React hooks/views that consume them
- CLI commands last, reusing the same orchestration as the routes

### Parallel Opportunities

- All Setup tasks marked [P] can run together
- All Foundational tasks marked [P] can run together once their own prerequisites (if any) are done
- Once Foundational completes, US1–US5 can be staffed in parallel
- Within a story, all [P] test tasks can run together; all [P] pure-function implementation tasks can run together

---

## Parallel Example: User Story 1

```bash
# Tests (write first, run together, confirm all fail):
Task: "Contract test GenerativeAnswerModel in tests/contract/generative-answer-model.contract.ts"
Task: "Contract test POST /api/ask in tests/contract/ask.contract.ts"
Task: "Integration test ask flow in tests/integration/ask.integration.ts"
Task: "Component test AskSearch in tests/component/AskSearch.test.tsx"

# Pure/adapter functions (implement together once tests above are red):
Task: "Implement GenerativeAnswerModel interface in src/lib/search/generativeAnswerModel.ts"
Task: "Implement fakeGenerativeAnswerModel in src/lib/search/fakeGenerativeAnswerModel.ts"
Task: "Implement buildGroundingSources in src/lib/search/buildGroundingSources.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenario 1 against the fakes
5. Demo Ask & Search in isolation before building Library/Favorites/Upload/Access Request review

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + User Story 1 → validate independently → MVP
3. + User Story 2 → validate independently → demo
4. + User Story 3 → validate independently (favorite/revisit) → demo
5. + User Story 4 → validate independently (drag-drop upload, expanded formats) → demo
6. + User Story 5 → validate independently (request/approve/deny) → demo
7. + Polish (e2e, accessibility, security, coverage gate, quickstart) → release-ready

---

## Notes

- [P] tasks touch different files and have no unmet dependency within their phase
- [Story] labels map tasks to spec.md's user stories for traceability; Setup/Foundational/Polish carry none
- Functional core (`src/lib/**`) is unit-testable without mocks; only the imperative shell (`src/backend/**`, CLI) needs the fakes from Phase 2 and each story's own fakes
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
- The `userDirectory` addition to `fakeAuthProvider`/`googleAuthProvider` (T073–T074) is intentionally backward-compatible: feature 001's existing tests construct these providers without a `userDirectory` and must continue passing unmodified
- T089–T091 were added after an initial `/speckit-analyze` pass flagged that FR-016 (version/supersede filtering) and FR-015 (cross-surface download) — both "preserve existing feature 001 behavior" requirements — had no explicit re-verification under the new UI, and that `DocumentViewerModal` (Foundational, shared by three stories) had no dedicated test task. They are Polish-phase rather than per-story because they verify behavior that only exists once US1, US2, and US3 are all built
