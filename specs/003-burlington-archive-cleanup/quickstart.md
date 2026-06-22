# Quickstart: Verify Burlington Archive Design Alignment Cleanup

## Prerequisites

- Node dependencies installed (`npm install`)
- Working tree on branch `003-burlington-archive-cleanup`

## Scenario 1 — Orphaned files removed (FR-001, FR-002)

1. Confirm the 5 files no longer exist:
   ```bash
   ls src/app/routes/CatalogSearch.tsx src/app/routes/DocumentBrowser.tsx \
      src/app/routes/BatchStatusDashboard.tsx src/app/routes/PublicationHistory.tsx \
      src/app/components/DiscoverabilityBadge.tsx 2>&1
   # Expected: "No such file or directory" for all five
   ```
2. Confirm their matching test files no longer exist:
   ```bash
   ls tests/component/CatalogSearch.test.tsx tests/component/DocumentBrowser.test.tsx \
      tests/component/BatchStatusDashboard.test.tsx tests/component/PublicationHistory.test.tsx \
      tests/component/DiscoverabilityBadge.test.tsx 2>&1
   # Expected: "No such file or directory" for all five
   ```
3. Confirm no remaining references anywhere in `src/` or `tests/`:
   ```bash
   grep -rn "CatalogSearch\|DocumentBrowser\|BatchStatusDashboard\|PublicationHistory\|DiscoverabilityBadge" src tests
   # Expected: no output (the `CatalogSearchParams` type in src/app/queries/useCatalog.ts
   # is an unrelated coincidental name match from before this cleanup and is out of scope)
   ```
4. Confirm the build, typecheck, and full test suite still pass (this is the real safety
   net against a missed stale import):
   ```bash
   npm run typecheck
   npm run build:app
   npm test
   ```
   Expected: all three succeed; test pass count should drop by exactly the number of
   tests that lived in the 5 deleted test files (no other test should fail).
5. Confirm every previously-reachable route still renders — open the app and click
   through Ask & Search, Library, Favorites, Upload (as an editor), and Access Requests
   (as an editor). Expected: identical behavior to before this change.

## Scenario 2 — Sign-in copy matches the reference design literally (FR-003, FR-004)

1. Inspect `src/app/routes/SignIn.tsx`: the title must read `GMC · Burlington Historical
   Archive` using a plain space and a literal `·` character (no `&#8202;` or `&middot;`
   entities), and the "Single sign-on · Your role is set by your workspace admin" line
   must use a literal `·` (no `&middot;`).
2. Inspect `src/app/routes/RequestAccess.tsx`: confirm the existing "GMC Burlington" copy
   already uses a plain space (it does — no change needed here; FR-004 is satisfied by
   the current implementation).
3. Run the existing sign-in test to confirm no regression:
   ```bash
   npx jest tests/component/SignIn.test.tsx
   ```
   Expected: passes — rendered text content is unaffected by entity-vs-literal source
   markup.

## Done

Both scenarios passing, with `npm run typecheck && npm run build:app && npm test` green,
confirms this feature is complete.
