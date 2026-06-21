# Implementation Plan: GMC Archive to Open Knowledge Publisher

**Branch**: `001-gmc-okf-ingestion` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-gmc-okf-ingestion/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A React SPA lets GMC archivists (Viewer/Publisher roles) browse archive
documents, convert them to Open Knowledge records, publish them to a
searchable Knowledge Catalog (individually or in batches up to 50, with
versioning on republish), confirm Agent Search discoverability, run
semantic/natural-language catalog search with structured filters, and
download source documents in their original format. Per Google's
recommended architecture for this kind of system, "Knowledge Catalog" and
"Agent Search" are realized using Cloud Storage (source files), Pub/Sub +
Document AI (async OCR/text/entity extraction), a vector index for
semantic search, and an App Engine backend that both serves the SPA's API
and runs the ingestion pipeline. Credentialed Google API calls never reach
the browser — the SPA talks only to this App Engine backend. Authentication
is isolated behind a swappable identity-provider interface (Google Sign-In
today, WordPress accounts later, via Cloud Identity) so the app can be
embedded in a WordPress plugin without touching business logic.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), targeting ES2020+; Node.js 20 LTS for the App Engine backend/CLI

**Primary Dependencies**: React 18, Redux Toolkit, TanStack Query, Ramda,
React Router (`HashRouter`), React Testing Library; backend: Google Cloud
client libraries for Cloud Storage, Pub/Sub, Document AI, and the vector
search service backing semantic catalog search (decision in research.md),
plus Cloud Identity/Google Identity Services for auth

**Storage**: Cloud Storage holds original source document files
(versioned objects, one per `ArchiveDocument` version); a metadata store
(decision in research.md) holds `ArchiveDocument`, `OkfRecord`,
`CatalogEntry` (including version/superseded chains), and `PipelineStatus`/
history records; semantic search embeddings are held in a vector index
separate from this metadata store but keyed back to the same
`catalogEntryId`

**Testing**: Jest + React Testing Library (unit/component), Playwright
(end-to-end), contract tests for the Google services adapter (Cloud
Storage, Pub/Sub, Document AI, vector search) and the identity-provider
abstraction

**Target Platform**: Modern evergreen browsers, deployed today as a
standalone web app on App Engine and designed to also run embedded inside
a WordPress plugin later (hash-based routing chosen for that compatibility)

**Project Type**: web — React SPA + an App Engine backend that serves the
SPA's API and hosts the async ingestion pipeline (Pub/Sub subscriber →
Document AI → vector indexing); core domain logic (OKF conversion, catalog
client, auth abstraction) lives in a framework-agnostic library consumed by
the SPA, the backend, and a CLI for headless batch operations

**Performance Goals**: Single-document conversion-to-publish in <5 min
active effort (SC-001); catalog search + download in <1 min (SC-006);
catalog search results returned in <2s for a 50-result page; ≥80% of
natural-language queries surface the relevant document on the first page
of results (SC-007)

**Constraints**: No client-side exposure of Google service credentials;
batch operations capped at 50 documents (FR-011); republishing a corrected
document creates a new version rather than overwriting (FR-007a); ESLint
enforces double quotes, no trailing commas, mandatory semicolons,
mandatory braces on all `if` statements, and disallows the `any` type;
`@/src` path alias required in both `tsconfig.json` and Jest config; all
source under `src/`

**Scale/Scope**: Small set of trusted Viewer/Publisher users; archive on
the order of hundreds to low thousands of documents (per
`GMC-Newsletter-List.md`); batches up to 50 documents per operation; exact
document/query volume, data-residency, and accuracy targets are deferred
operational decisions (per spec Assumptions), not fixed here

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applied as |
|---|---|
| I. Library-First | Core domain logic (OKF conversion + entity extraction, Cloud Storage/Document AI/vector-search adapters, auth-provider interface) is a standalone, framework-agnostic library under `src/lib`, independently unit-tested, consumed by the React app, the App Engine backend, and the CLI. |
| II. CLI Interface | `src/cli` wraps the library for headless batch conversion/publish (e.g., bulk-importing the existing `GMC-Newsletter-List.md` backlog) without the UI; stdin/args → stdout, errors → stderr; supports `--json` and human-readable output. |
| III. Test-First (NON-NEGOTIABLE) | Tasks in `tasks.md` are ordered test-first: contract/unit tests written and confirmed failing before implementation for every library module, backend route, Pub/Sub subscriber, and UI component. |
| IV. Integration Testing | Contract tests cover the Google services adapter (Cloud Storage upload/versioning, Pub/Sub publish/subscribe, Document AI OCR/entity extraction, vector-search index/query, Agent Search discoverability) and the identity-provider abstraction (Google Sign-In today; a fake/in-memory provider proves the interface is swappable). Playwright covers the cross-view UI flows. |
| V. Observability, Versioning & Simplicity | The backend and library emit structured logs per request/Pub/Sub message, surfaced through Cloud Monitoring; the library is versioned independently (SemVer) from the SPA/backend; no speculative third auth provider, second vector-search vendor, or extra abstraction is built beyond what FR-001b/FR-013 require. |

No unjustified violations — see Complexity Tracking for the one deliberate
deviation (adding a backend to an otherwise "standalone" SPA) and its
rationale.

**Documented Library-First exception (speckit-analyze F1)**: the
`IngestionQueue` (Pub/Sub) interface and its fake live under
`src/backend/ingestion/`, not `src/lib/**`, unlike the other three Google
services adapters (`DocumentStorage`, `DocumentProcessor`,
`SemanticIndex`). This is intentional, not an oversight: `IngestionQueue`'s
subscriber side is inherently tied to the App Engine backend's request
lifecycle (it is *how* `src/backend` dispatches work to itself
asynchronously), so it has no meaningful standalone use outside the
backend the way the other adapters do (which are also called directly by
the CLI). The interface is still defined as a pure contract and given a
fake for contract tests (contracts/google-services-adapter.md), satisfying
the *testability* intent of Library-First even though the module lives
under `src/backend`.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── lib/                      # Framework-agnostic domain library (Principle I)
│   ├── auth/                 # Identity-provider interface + Google/WordPress/fake implementations
│   ├── conversion/            # Archive document → OKF record conversion; entity/author/location extraction
│   ├── storage/                # Cloud Storage adapter (upload, versioned reads, original-format download)
│   ├── catalog/                # Knowledge Catalog: metadata store client, versioning/supersede logic, dedupe
│   └── search/                  # Vector-search client: index, semantic query, structured filters; Agent Search discoverability check
├── cli/                      # Headless batch CLI wrapping src/lib (Principle II)
├── backend/                   # App Engine service: serves the SPA's API + runs the ingestion pipeline
│   ├── routes/                  # HTTP routes consumed by src/app
│   ├── ingestion/                # Pub/Sub subscriber → Document AI → embeddings → vector index
│   └── store/                     # Pipeline status / history persistence (metadata store)
└── app/                       # React SPA
    ├── routes/                     # HashRouter views: browse, batch status, history, catalog search
    ├── components/
    ├── store/                      # Redux Toolkit slices
    └── queries/                     # TanStack Query hooks calling the backend API

tests/
├── contract/                  # Google services adapter (Storage/Pub-Sub/Document AI/vector search) + auth-provider contract tests
├── integration/                # Backend route tests, Pub/Sub subscriber tests, CLI batch tests
├── component/                   # React component tests (Jest + RTL)
└── e2e/                          # Playwright flows across views
```

**Structure Decision**: Web application structure (SPA + an App Engine
backend that also runs the async ingestion pipeline), kept under a single
`src/` root per the user's explicit instruction rather than split
`frontend/`/`backend/` top-level folders. `src/lib` carries the
Library-First domain logic shared by `src/app` (SPA), `src/backend`, and
`src/cli`; this is closest to the template's Option 2 (web application)
while satisfying the "put all code in an `src` folder" requirement and the
`@/src` path alias used in `tsconfig.json` and Jest config.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Adding a backend (`src/backend`, deployed on App Engine) to an otherwise "standalone" SPA | Google's recommended architecture for this kind of system requires server-side credentialed calls (Cloud Storage, Pub/Sub, Document AI, vector search) that must not be shipped to the browser (FR-008, FR-014); it is also where the async ingestion pipeline (Pub/Sub → Document AI → indexing) has to run | A pure client-only SPA calling Google APIs directly would have to embed long-lived service credentials in browser JS, where they are trivially extractable, and has no place to run an async, multi-step ingestion pipeline — rejected as a security and feasibility violation, not a stylistic preference |
