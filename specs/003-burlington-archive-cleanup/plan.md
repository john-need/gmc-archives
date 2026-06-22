# Implementation Plan: Burlington Archive Design Alignment Cleanup

**Branch**: `003-burlington-archive-cleanup` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-burlington-archive-cleanup/spec.md`

## Summary

The app already implements nearly every product-facing change in the
updated reference design (`GMC Burlington Archive.html`). The remaining
work is pure cleanup: delete 5 orphaned route/component files (and their 5
matching orphaned test files) left over from a design iteration that
predates the current implementation, and replace a handful of HTML entity
characters (`&#8202;`, `&middot;`, `&nbsp;`) with plain text on the sign-in
and request-access screens to match the reference design's literal markup.
No new dependencies, no data model changes, no API/contract changes.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode, per `tsconfig.json`)

**Primary Dependencies**: React 18, react-router-dom 6, Vite 5 (frontend
build); no new dependencies introduced by this feature

**Storage**: N/A — no data model or persistence touched by this feature

**Testing**: Jest 29 + Testing Library (component/unit), Playwright (e2e) —
existing suite, no new test framework introduced

**Target Platform**: Browser (Vite-built SPA), existing deployment target
unchanged

**Project Type**: Web application (single repo: `src/app` frontend +
`src/backend` API + `src/cli`) — this feature touches `src/app` only

**Performance Goals**: N/A — deletion-only change, no runtime behavior
affected for any reachable screen

**Constraints**: Zero regression — every currently reachable route must
keep working exactly as before; no visible behavior change apart from the
literal sign-in/request-access copy fix

**Scale/Scope**: 5 component/route files + 5 matching test files deleted; 2
existing files (`SignIn.tsx`, `RequestAccess.tsx`) get a small text edit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Test-First (NON-NEGOTIABLE)**: This feature is deletion-only for User
  Story 1 (no new behavior to drive with a failing test — the test files
  being deleted are themselves orphaned and untestable against anything
  reachable). For User Story 2 (copy fix), the existing `SignIn.test.tsx`
  /request-access tests already assert on rendered text; no new test is
  required since entity characters resolve to the same visible text in the
  DOM — confirmed during spec research. **Gate**: PASS (no new functional
  behavior is being introduced that requires a new red-green cycle).
- **Library-First / CLI Interface**: Not applicable — this feature touches
  only UI route/component files, not a library or CLI surface. **Gate**: PASS
  (no violation, principle doesn't apply to this change).
- **Functional Programming**: Not applicable — no new logic is added; the
  files being touched are deleted outright (no code survives to evaluate for
  purity/immutability) or get a literal string-constant edit with no
  transformation logic. **Gate**: PASS (no violation — nothing for this
  principle to govern).
- **Redux**: Not applicable — this feature adds no application state, no
  actions, and no reducers. The 5 deleted files and the `SignIn.tsx` copy
  edit do not touch the Redux store or any connected component logic.
  **Gate**: PASS (no violation — explicitly confirmed, not silently assumed).
- **Ramda**: Not applicable — this feature performs no data transformation
  (no map/filter/reduce/compose of any data structure); it is file deletion
  plus a literal string replacement. There is nothing for Ramda to be used
  for. **Gate**: PASS (no violation — explicitly confirmed, not silently
  assumed).
- **Naming Conventions**: Deleted files already violate nothing new; no new
  files are created by this feature. **Gate**: PASS.
- **Simplicity / YAGNI**: This feature directly serves YAGNI — removing
  code for screens that are unreachable. **Gate**: PASS.

No violations requiring justification — Complexity Tracking section below
is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-burlington-archive-cleanup/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output — N/A, no contract changes (see note below)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── routes/
│   │   ├── CatalogSearch.tsx          # DELETE — orphaned, not in router
│   │   ├── DocumentBrowser.tsx        # DELETE — orphaned, not in router
│   │   ├── BatchStatusDashboard.tsx   # DELETE — orphaned, not in router
│   │   ├── PublicationHistory.tsx     # DELETE — orphaned, not in router
│   │   ├── SignIn.tsx                 # EDIT — replace entity chars with plain text
│   │   ├── RequestAccess.tsx          # EDIT — replace &nbsp; with plain space
│   │   └── index.tsx                  # unchanged — already excludes the 4 deleted routes
│   └── components/
│       └── DiscoverabilityBadge.tsx   # DELETE — orphaned, not referenced
└── backend/                            # unchanged

tests/
└── component/
    ├── CatalogSearch.test.tsx         # DELETE — tests an orphaned component
    ├── DocumentBrowser.test.tsx       # DELETE — tests an orphaned component
    ├── BatchStatusDashboard.test.tsx  # DELETE — tests an orphaned component
    ├── PublicationHistory.test.tsx    # DELETE — tests an orphaned component
    ├── DiscoverabilityBadge.test.tsx  # DELETE — tests an orphaned component
    └── SignIn.test.tsx                # unchanged — already asserts on rendered text,
                                        # which is unaffected by entity vs. plain-text source
```

**Structure Decision**: Single web-app project (`src/app` frontend, `src/backend` API) — this
feature only deletes unreferenced files under `src/app` and `tests/component`, and edits two
existing route files' literal copy. No new directories or structural changes.

## Phase 1 note: contracts/ and data-model.md

This feature has no API contracts, no UI-prop contracts, and no data
entities to document — it deletes unreachable code and fixes literal text.
`data-model.md` and `contracts/` are intentionally omitted; `quickstart.md`
documents the verification steps instead (grep checks + build + test).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table intentionally left empty.
