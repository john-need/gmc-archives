# Research: Burlington Archive Design Alignment Cleanup

No NEEDS CLARIFICATION markers remained in the Technical Context after
`/speckit-specify` and `/speckit-clarify` — this feature's scope is fully
determined by direct codebase inspection rather than open technical
unknowns. The findings below were already established during spec
authoring and are restated here for traceability.

## Decision: Delete the 5 orphaned route/component files and their matching tests

**Rationale**: `CatalogSearch.tsx`, `DocumentBrowser.tsx`,
`BatchStatusDashboard.tsx`, `PublicationHistory.tsx`, and
`DiscoverabilityBadge.tsx` are not imported by `src/app/routes/index.tsx` or
any other reachable module — confirmed by a repository-wide grep for each
file's exported symbol name. Their corresponding files under
`tests/component/` test only these orphaned components and have no other
purpose. Deleting both sets removes dead code without reducing real test
coverage (the tests don't exercise anything reachable from the app).

**Alternatives considered**:
- *Leave them in place*: Rejected — dead code that doesn't correspond to
  any current screen actively misleads future readers and risks being
  reconnected to the router during future design-alignment work, defeating
  the purpose of aligning the app to the current design.
- *Move to an `_archive/` or `.deprecated/` folder instead of deleting*:
  Rejected — git history already preserves the prior version; a
  parking-lot folder is unrequested speculative scaffolding (YAGNI).

## Decision: Replace HTML entity characters with plain text on SignIn/RequestAccess

**Rationale**: The reference design (`GMC Burlington Archive.html`) renders
the title and request-access copy using plain spaces and a literal middle-dot
character, not `&#8202;` (hair space), `&middot;`, or `&nbsp;` entities. The
visible rendered text is identical either way (entities resolve to the same
characters in the DOM), so this is a markup-source change only, with zero
visible or behavioral impact. Existing component tests (`SignIn.test.tsx`)
assert on rendered text content and are unaffected.

**Alternatives considered**:
- *Leave entities in place since visible output is identical*: Rejected —
  the user's request was to "reflect" the design's changes, and the design
  source deliberately simplified this markup; matching it removes a
  needless divergence for future diffing against the reference design.

## Decision: No new tests required for the deletion

**Rationale**: Per the project constitution's Test-First principle, new
*behavior* requires a failing test first. This feature introduces no new
behavior — it removes unreachable code. The acceptance criteria (FR-001,
FR-002) are verified by: (a) a repository-wide search confirming zero
remaining references, and (b) the existing build/typecheck/test suite
continuing to pass, which would fail if any live code still depended on a
deleted file.

**Alternatives considered**:
- *Write a new test asserting the files don't exist*: Rejected — a
  filesystem-existence test is brittle scaffolding for a one-time cleanup;
  the build/typecheck step already provides the real safety net (a stale
  import fails the build).
