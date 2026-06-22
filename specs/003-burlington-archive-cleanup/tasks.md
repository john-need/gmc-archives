---

description: "Task list for Burlington Archive Design Alignment Cleanup"
---

# Tasks: Burlington Archive Design Alignment Cleanup

**Input**: Design documents from `/specs/003-burlington-archive-cleanup/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Included per user request (TDD). This feature is deletion-only, so
"red" means: prove the files are currently referenced nowhere live (the
unreachable-but-present state we're fixing), then delete, then prove the
suite still passes. No new test files are written — see research.md
("No new tests required for the deletion").

**Note (ponytail)**: No Setup or Foundational phase — there is no new
infrastructure, dependency, or shared scaffolding for a 7-file deletion plus
a 2-line text edit. Skipping those phases entirely rather than inventing
filler tasks.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: User Story 1 - Remove orphaned pre-redesign screens (Priority: P1) 🎯 MVP

**Goal**: Delete the 5 unreachable route/component files and their 5 matching
orphaned test files; nothing in the app should reference them afterward.

**Independent Test**: `grep -rn "CatalogSearch\|DocumentBrowser\|BatchStatusDashboard\|PublicationHistory\|DiscoverabilityBadge" src tests` returns no hits (aside from the unrelated `CatalogSearchParams` type), and `npm run typecheck && npm run build:app && npm test` all pass.

### Red: capture baseline before deleting (T001)

- [X] T001 [US1] Run `grep -rn "CatalogSearch\|DocumentBrowser\|BatchStatusDashboard\|PublicationHistory\|DiscoverabilityBadge" src tests` and confirm it only matches the 5 target files + their 5 tests + the unrelated `CatalogSearchParams` type in `src/app/queries/useCatalog.ts` — this confirms the files are otherwise unreferenced before deletion begins

### Delete (T002-T011, all parallel — independent files)

- [X] T002 [P] [US1] Delete `src/app/routes/CatalogSearch.tsx`
- [X] T003 [P] [US1] Delete `src/app/routes/DocumentBrowser.tsx`
- [X] T004 [P] [US1] Delete `src/app/routes/BatchStatusDashboard.tsx`
- [X] T005 [P] [US1] Delete `src/app/routes/PublicationHistory.tsx`
- [X] T006 [P] [US1] Delete `src/app/components/DiscoverabilityBadge.tsx`
- [X] T007 [P] [US1] Delete `tests/component/CatalogSearch.test.tsx`
- [X] T008 [P] [US1] Delete `tests/component/DocumentBrowser.test.tsx`
- [X] T009 [P] [US1] Delete `tests/component/BatchStatusDashboard.test.tsx`
- [X] T010 [P] [US1] Delete `tests/component/PublicationHistory.test.tsx`
- [X] T011 [P] [US1] Delete `tests/component/DiscoverabilityBadge.test.tsx`

### Green: verify (T012)

- [X] T012 [US1] Run `npm run typecheck && npm run build:app && npm test` and confirm all three succeed with no failures outside the expected drop in test count from the 5 deleted test files (depends on T001-T011)

**Checkpoint**: App has zero dead pre-redesign route/component files; build and full test suite are green.

---

## Phase 2: User Story 2 - Match sign-in screen copy literally to the reference design (Priority: P2)

**Goal**: Replace `&#8202;`/`&middot;` entities on the sign-in title and
tagline with plain text, matching the reference design's literal markup.
(`RequestAccess.tsx` already uses a plain space for "GMC Burlington" —
confirmed in plan.md — no change needed there.)

**Independent Test**: `grep -n "&#8202;\|&middot;" src/app/routes/SignIn.tsx` returns no hits, and `npx jest tests/component/SignIn.test.tsx` still passes.

### Red: capture baseline (T013)

- [X] T013 [P] [US2] Run `grep -n "&#8202;\|&middot;\|&nbsp;" src/app/routes/SignIn.tsx src/app/routes/RequestAccess.tsx` and confirm the two hits are both in `SignIn.tsx` (line with the title, line with "Single sign-on · ...") and `RequestAccess.tsx` has none

### Edit (T014)

- [X] T014 [US2] In `src/app/routes/SignIn.tsx`, replace `GMC&#8202;·&#8202;Burlington Historical Archive` with `GMC · Burlington Historical Archive`, and replace `Single sign-on &middot; Your role is set by your workspace admin` with `Single sign-on · Your role is set by your workspace admin` (depends on T013)

### Green: verify (T015)

- [X] T015 [US2] Run `grep -n "&#8202;\|&middot;" src/app/routes/SignIn.tsx` (expect no output) and `npx jest tests/component/SignIn.test.tsx` (expect pass) (depends on T014)

**Checkpoint**: Sign-in screen markup matches the reference design's literal text exactly; existing test suite unaffected.

---

## Phase 3: Polish

- [X] T016 Run the full `specs/003-burlington-archive-cleanup/quickstart.md` validation end-to-end (depends on T012, T015)

---

## Dependencies & Execution Order

- **US1 (P1)**: No dependencies — can start immediately. T001 → (T002-T011 parallel) → T012.
- **US2 (P2)**: Independent of US1 (different files) — can run in parallel with US1 if staffed, or after. T013 → T014 → T015.
- **Polish**: Depends on both US1 and US2 checkpoints (T012, T015).

## Parallel Example

```bash
# All deletions in US1 (different files, no dependencies on each other):
Task: "Delete src/app/routes/CatalogSearch.tsx"
Task: "Delete src/app/routes/DocumentBrowser.tsx"
Task: "Delete src/app/routes/BatchStatusDashboard.tsx"
Task: "Delete src/app/routes/PublicationHistory.tsx"
Task: "Delete src/app/components/DiscoverabilityBadge.tsx"
Task: "Delete tests/component/CatalogSearch.test.tsx"
Task: "Delete tests/component/DocumentBrowser.test.tsx"
Task: "Delete tests/component/BatchStatusDashboard.test.tsx"
Task: "Delete tests/component/PublicationHistory.test.tsx"
Task: "Delete tests/component/DiscoverabilityBadge.test.tsx"

# US1 and US2 can run fully in parallel — disjoint file sets:
Task: "T001 baseline grep for US1"
Task: "T013 baseline grep for US2"
```

## Implementation Strategy

**MVP** = Phase 1 (US1) alone — deleting the dead code is the highest-value,
zero-risk change and is independently shippable. Phase 2 (US2) is a
cosmetic follow-on with no functional dependency on Phase 1.
