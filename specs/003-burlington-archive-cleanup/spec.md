# Feature Specification: Burlington Archive Design Alignment Cleanup

**Feature Branch**: `003-burlington-archive-cleanup`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "there are design changes in designs/Google Knowledge Catalog UI/GMC Burlington Archive.html. refactor the app to reflect these changes"

## Clarifications

### Session 2026-06-22

- Q: The app has an editor-only "Access Requests" review screen (approve/deny
  pending access requests) that the new design's mock does not depict at all.
  Should it be kept, removed, or out of scope? → A: Keep it — the design mock
  simply doesn't render admin/back-office screens (it implies approval
  happens "by email"); the in-app review screen remains the only real
  moderation path and stays as an intentional extension beyond the mock.

## Background

`designs/Google Knowledge Catalog UI/GMC Burlington Archive.html` is a newer
revision of the reference design that the app's routes/components were
previously built against (`Knowledge Catalog.dc.html`, implemented in
feature 002). Comparing the two design files and the current implementation
shows that nearly every product-facing change in the new revision — app
title ("GMC · Burlington Historical Archive"), nav structure (Ask & Search /
Library / Favorites / Upload, no separate Collections management), removal
of per-document citation and metadata-editing UI, and the catalog-wide
Upload flow — is **already implemented** in the current app. The remaining
gap is leftover dead code from an earlier design iteration that predates
both reference files, plus a small literal-copy mismatch on the sign-in
screen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove orphaned pre-redesign screens (Priority: P1)

A developer working in this codebase should only find routes and components
that correspond to a screen reachable in the live app and reflected in the
current reference design. Today, five files from an earlier design
iteration — `CatalogSearch.tsx`, `DocumentBrowser.tsx`,
`BatchStatusDashboard.tsx`, `PublicationHistory.tsx`, and
`DiscoverabilityBadge.tsx` — exist under `src/app/routes` and
`src/app/components` but are not registered in the router and are not
reachable from any nav item or link.

**Why this priority**: Dead code that doesn't match any current screen is
actively misleading — it implies functionality exists that a user can never
reach, and risks being mistaken for a real gap (or accidentally wired back
up) during future design-alignment work.

**Independent Test**: Search the codebase for references to each of the
five files; confirm none are imported by the router or any reachable
component, delete them, and confirm the app still builds, type-checks, and
all existing routes still render.

**Acceptance Scenarios**:

1. **Given** the current router configuration, **When** a developer
   searches for `CatalogSearch`, `DocumentBrowser`, `BatchStatusDashboard`,
   `PublicationHistory`, or `DiscoverabilityBadge`, **Then** no references
   remain anywhere in `src/`.
2. **Given** the cleaned-up codebase, **When** the app is built and its
   existing test suite is run, **Then** the build succeeds and no test that
   previously passed starts failing.

---

### User Story 2 - Match sign-in screen copy literally to the reference design (Priority: P2)

The sign-in screen's title and supporting copy currently render the same
visible text as the new design but via different markup (hair-space/`&middot;`
HTML entities and `&nbsp;` instead of plain spaces and a literal "·"
character). A developer or designer diffing the implementation against the
reference design should see matching markup, not just visually-equivalent
output.

**Why this priority**: Lower priority than removing dead code — this is a
cosmetic, low-risk text change with no behavioral impact — but still part of
"reflect these changes" since the new design file deliberately simplified
this markup.

**Independent Test**: Open the sign-in and request-access screens and
compare the rendered title/copy markup against the literal text in
`GMC Burlington Archive.html`.

**Acceptance Scenarios**:

1. **Given** the sign-in screen, **When** its title is inspected, **Then**
   it renders "GMC · Burlington Historical Archive" using a plain space and
   literal middle-dot character (no `&#8202;`/`&middot;` entities).
2. **Given** the request-access screen, **When** its body copy referencing
   "GMC Burlington" is inspected, **Then** it uses a plain space (no
   `&nbsp;`).

---

### Edge Cases

- What happens if a deleted file is still referenced by a stale import
  somewhere not caught by a simple text search (e.g., a dynamic import or a
  barrel/index re-export)? → The build and type-check step in User Story 1's
  acceptance test must catch this; do not delete without confirming a clean
  build.
- What if removing `DiscoverabilityBadge.tsx` affects an otherwise-unrelated
  shared type or utility it happens to export? → Confirmed during research
  that all five files are self-contained with no real outbound dependents;
  re-verify at implementation time before deleting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The codebase MUST NOT contain `CatalogSearch.tsx`,
  `DocumentBrowser.tsx`, `BatchStatusDashboard.tsx`, `PublicationHistory.tsx`,
  or `DiscoverabilityBadge.tsx`, nor any import of them.
- **FR-002**: The application's router MUST continue to expose exactly the
  same reachable routes as before this cleanup (Ask & Search, Library,
  Favorites, Upload, Access Requests) — this is a deletion-only change with
  no route behavior change.
- **FR-003**: The sign-in screen's title MUST render as plain text "GMC ·
  Burlington Historical Archive" without hair-space or named-entity
  characters in the source markup.
- **FR-004**: The request-access screen's copy referencing "GMC Burlington"
  MUST use a plain space rather than a non-breaking-space entity.
- **FR-005**: The existing Access Requests review screen and its
  approve/deny capability MUST remain unchanged — this feature is explicitly
  out of scope for removal despite not appearing in the reference design
  mock.

### Key Entities

*No data model changes — this feature only removes unreferenced UI code and
adjusts literal text markup; no entities are added, changed, or removed.*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero files in `src/` reference any of the five removed
  components after cleanup, verified by a repository-wide search.
- **SC-002**: The application builds and all pre-existing automated tests
  pass after the cleanup, with no reduction in route coverage.
- **SC-003**: A side-by-side comparison of the sign-in/request-access screen
  markup against `GMC Burlington Archive.html` shows matching plain-text
  copy with no leftover entity characters.

## Assumptions

- The current implementation already reflects nearly all of the new
  design's product-facing changes (title, nav structure, removal of
  citation/collection-CRUD/document-edit UI, catalog-wide upload copy, and
  color tokens) — confirmed by direct comparison of the decoded design
  template against `src/app/routes/*` and `src/app/styleTokens.ts`. This
  feature's scope is therefore limited to the residual gaps: dead-code
  removal and literal copy alignment.
- The five removed files are presumed to have no other purpose (e.g.,
  storybook stories, documentation examples) beyond having been routes/
  components for a now-superseded design iteration; this is re-confirmed
  immediately before deletion in implementation.
