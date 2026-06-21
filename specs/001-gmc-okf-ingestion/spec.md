# Feature Specification: GMC Archive to Open Knowledge Publisher

**Feature Branch**: `001-gmc-okf-ingestion`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "I need to setup an entire project. Stack includes Typescript, react, eslint, jest, playwright, redux, tanstack-query, ramda. this project is a standalone react web application that will be a user interface for a Google Open Knowledge project. include any libraries needed to access Google Open Knowledge. This system will add documents from the Green Mountain club archives, convert them to Open Knowledge format and add them to Google's Open Knowledge Format (OKF), Knowledge Catalog, and Agent Search. put all code in an src folder. setup Jest and TSConfig. Add paths to both for @/src folder. setup rules in eslint for double quotes, no dangling commas, required semi colons, and required braces on all if statements, do not permit the use of \"any\" type"

## Clarifications

### Session 2026-06-21

- Q: What source document formats must the system accept from the GMC archive? → A: PDF + scanned images (OCR required) + plain text/markdown.
- Q: Does the application need multiple distinct navigable views/pages, or is this a single-page workflow? → A: Multiple distinct views — a document browser, a batch status dashboard, and a publication history view.
- Q: Is there a maximum number of documents that can be included in a single batch conversion/publish operation? → A: Cap at 50 documents per batch.
- Q: Is there a single "archivist" role, or distinct roles (e.g., viewer vs. publisher)? → A: Two roles — Viewer (browse documents, check status/history) and Publisher (can additionally convert and publish).
- Q: When downloading a document, should it be converted to PDF regardless of original format, or returned in its original format? → A: Downloaded in original format (e.g., a scanned-image or plain text/markdown source is downloaded as-is, not converted to PDF).
- Q: Should Knowledge Catalog search be scoped to entries this application published (GMC archive only), or the full Google Knowledge Catalog? → A: GMC entries only (confirmed FR-013 as drafted).
- Q: How does a user authenticate into the application itself, and is the choice of provider expected to change over time? → A: The application authenticates users through a swappable identity-provider abstraction, decoupled from the rest of the system. The initial provider is Google Sign-In. The application is also intended to be embedded in a WordPress plugin in the future, at which point it must authenticate users via their existing WordPress accounts instead, without requiring changes to the rest of the system.
- Q: Should Knowledge Catalog "querying" support natural-language/semantic search, not just structured filtering by title/section/date? → A: Yes — semantic search is the primary mode, with structured title/section/date filters available as refinements.
- Q: When a previously published document's source is corrected or updated, should republication be supported, and how is the prior version handled? → A: Republishing creates a new version; the prior version remains accessible (marked superseded) rather than being deleted, with the latest version surfaced by default.
- Q: Should the system extract structured metadata beyond title/date/section/source identifier (e.g., author, location, named entities)? → A: Yes — extract and preserve author, location, and key named entities when present, in addition to the core fields.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convert an Archive Document to Open Knowledge Format (Priority: P1)

An archivist selects a document from the Green Mountain Club (GMC) archive and
converts it into Google's Open Knowledge Format (OKF), preserving the
document's key metadata (title, date, section, source identifier) in the
converted record.

**Why this priority**: Conversion is the foundational step — without it, no
document can ever reach the Knowledge Catalog or Agent Search. It is the
smallest piece of the workflow that delivers standalone value (a correctly
structured OKF record).

**Independent Test**: Select one archive document, run the conversion, and
verify a valid OKF record is produced with the document's metadata intact —
independent of whether publishing succeeds afterward.

**Acceptance Scenarios**:

1. **Given** an archive document with complete metadata, **When** the
   archivist initiates conversion, **Then** the system produces an OKF
   record containing the document's title, date, section, and source
   identifier.
2. **Given** an archive document with missing or malformed metadata,
   **When** the archivist initiates conversion, **Then** the system reports
   which fields are missing or invalid without discarding the source
   document.

---

### User Story 2 - Publish a Converted Record to the Knowledge Catalog (Priority: P2)

An archivist submits a successfully converted OKF record to Google's
Knowledge Catalog so the document becomes part of the searchable catalog.

**Why this priority**: Publishing is the step that gives the converted
record real-world value — it cannot happen without User Story 1, but it
delivers the next unit of value (a discoverable catalog entry) on its own.

**Independent Test**: Take an already-converted OKF record (created
independently of a live conversion run) and publish it to the Knowledge
Catalog; verify the catalog reflects a new entry and the system reports
success.

**Acceptance Scenarios**:

1. **Given** a valid OKF record, **When** the archivist submits it to the
   Knowledge Catalog, **Then** the system confirms successful publication
   and records the catalog entry's identifier.
2. **Given** an OKF record for a document version that was already
   published, **When** the archivist attempts to submit the same version
   again, **Then** the system blocks the duplicate submission and explains
   why, while still allowing a corrected new version to be published
   (FR-007a).
3. **Given** a temporary failure communicating with the Knowledge Catalog,
   **When** the archivist submits a record, **Then** the system reports the
   failure clearly and allows a retry without re-converting the document.

---

### User Story 3 - Query the Knowledge Catalog and Download Source Documents (Priority: P2)

A user searches the Knowledge Catalog entries published by this application
using a natural-language query (e.g., "trail maintenance reports from the
1970s") to find semantically relevant GMC archive documents, optionally
narrowing results with structured filters (title, section, date), then
downloads the original source document (in its original PDF,
scanned-image, or plain text/markdown format) for offline reading or
sharing.

**Why this priority**: Once documents are published (User Story 2), being
able to find them again and retrieve the underlying source file is what
makes the catalog useful day-to-day; it depends on publishing having
happened but does not depend on Agent Search discoverability (User Story
4).

**Independent Test**: Given one or more records already published to the
Knowledge Catalog, search for one by a known attribute (e.g., title or
section) and download its original source document — independent of
running a new conversion, publish, or Agent Search check.

**Acceptance Scenarios**:

1. **Given** documents already published to the Knowledge Catalog, **When**
   a user submits a natural-language query describing the topic they are
   looking for, **Then** the system returns semantically relevant matching
   catalog entries published by this application, ranked by relevance.
2. **Given** results from a semantic query, **When** the user applies a
   title, section, or date filter, **Then** the system narrows the results
   to those also matching the filter.
3. **Given** a search that matches no published catalog entries, **When**
   a user submits it, **Then** the system clearly indicates no results
   rather than an error.
4. **Given** a catalog entry, **When** a user requests to download its
   source document, **Then** the system returns the original file in the
   same format it was originally submitted in (e.g., PDF stays a PDF;
   a scanned image or plain text/markdown source is not converted to PDF).

---

### User Story 4 - Confirm Discoverability via Agent Search (Priority: P3)

An archivist verifies that a published document can be found and surfaced
through Google's Agent Search after it has been added to the Knowledge
Catalog.

**Why this priority**: This closes the loop on the end-to-end goal (archives
become answerable through Agent Search) but depends on publishing already
being complete, making it the natural final increment.

**Independent Test**: Given a record already published to the Knowledge
Catalog, check the system's reported discoverability status for that record
independent of running a new conversion or publish.

**Acceptance Scenarios**:

1. **Given** a record published to the Knowledge Catalog, **When** the
   archivist checks its status, **Then** the system indicates whether the
   record is discoverable via Agent Search.
2. **Given** a record that has not yet become discoverable, **When** the
   archivist checks its status, **Then** the system shows a pending state
   rather than a false success or failure.

---

### Edge Cases

- What happens when a source document's file format cannot be parsed at all
  (e.g., corrupted scan, an unsupported file type outside PDF/scanned
  image/plain text, or a scan where OCR confidence is too low to trust)?
- How does the system handle a partial failure where conversion succeeds but
  publishing to the Knowledge Catalog fails, or publishing succeeds but the
  record never becomes discoverable in Agent Search?
- What happens when Google's services are unreachable or return an
  authentication/authorization error?
- How does the system handle two archivists attempting to convert or publish
  the same source document at the same time?
- What happens when a user searches for a document by a version that has
  since been superseded — does the system surface the superseded version,
  the latest version, or both with a clear indication of which is current?
- What happens when a user tries to download the source document for a
  catalog entry whose original file is no longer available in storage?
- How does the system handle a Viewer searching the catalog while a batch
  publish operation is still in progress (should in-flight, not-yet-fully
  published documents appear in results)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authorized user to select one or more
  documents from the GMC archive for conversion.
- **FR-001a**: System MUST distinguish between two roles: a Viewer, who can
  browse archive documents and check pipeline status/history, and a
  Publisher, who can additionally initiate conversion and publish to the
  Knowledge Catalog. The system MUST prevent a Viewer from initiating
  conversion or publishing.
- **FR-001b**: System MUST authenticate every user through an identity
  provider before granting Viewer or Publisher access, and MUST be able to
  swap which identity provider is in effect (e.g., Google Sign-In today,
  WordPress account authentication when later embedded in a WordPress
  plugin) without changing the Viewer/Publisher permission model or any
  other functional requirement in this specification.
- **FR-002**: System MUST convert a selected document into an Open
  Knowledge Format (OKF) record, preserving the document's title, date,
  section, and source identifier.
- **FR-002b**: System MUST extract and preserve, when present in the
  source document, structured metadata beyond the core fields, including
  author, location, and key named entities, attaching them to the OKF
  record.
- **FR-002a**: System MUST accept source documents in PDF format, scanned
  image formats (requiring optical character recognition to extract text),
  and plain text/markdown formats, and MUST reject unsupported formats with
  a clear error rather than silently failing.
- **FR-003**: System MUST allow a user to submit a converted OKF record to
  Google's Knowledge Catalog.
- **FR-004**: System MUST report whether a published record has become
  discoverable through Google's Agent Search.
- **FR-005**: System MUST display the current status of every document in
  the pipeline (e.g., imported, converted, publishing, published,
  discoverable, failed) at each stage.
- **FR-006**: System MUST report clear, actionable errors when conversion
  or publishing fails, and MUST retain the original source document so the
  operation can be retried.
- **FR-007**: System MUST prevent the same source document from being
  published to the Knowledge Catalog more than once *for the same
  version*; republishing a corrected version of an already-published
  source document is permitted (see FR-007a) rather than always blocked.
- **FR-007a**: When a source document is corrected and republished, System
  MUST create a new version of the catalog entry, mark the prior version as
  superseded rather than deleting it, and surface the latest version by
  default while keeping superseded versions accessible.
- **FR-008**: System MUST authenticate to Google's Open Knowledge services
  using credentials scoped to this application before any conversion or
  publish operation is attempted.
- **FR-009**: Users MUST be able to view a history of past conversion and
  publication attempts for a document, including failures, for auditing
  purposes.
- **FR-010**: System MUST allow a failed conversion or publish operation to
  be retried without requiring the user to re-select the source document.
- **FR-011**: System MUST allow a user to select and process multiple
  archive documents together in a single batch operation, while tracking
  and reporting the conversion/publish status of each document in the
  batch individually. A single batch MUST NOT exceed 50 documents; the
  system MUST prevent submission of a larger batch and explain the limit
  to the user.
- **FR-012**: System MUST provide distinct, independently navigable views
  for: browsing/selecting archive documents, monitoring batch
  conversion/publish status, reviewing publication history, and searching
  the Knowledge Catalog.
- **FR-013**: System MUST allow a user (Viewer or Publisher) to search
  Knowledge Catalog entries published by this application using
  natural-language, semantically-ranked queries as the primary search
  mode, with optional structured filters by title, section, and date to
  narrow semantic results, and MUST clearly indicate when a search returns
  no results.
- **FR-014**: System MUST allow a user (Viewer or Publisher) to download
  the original source document for any published catalog entry, returned
  in the same format it was originally submitted in (PDF, scanned image,
  or plain text/markdown) without converting it to a different format.
- **FR-015**: System MUST report a clear error, rather than a corrupted or
  empty file, when a user requests a download for a document whose
  original file is unavailable.

### Key Entities

- **Archive Document**: A source item from the GMC archive (e.g., newsletter
  issue or historical record) with metadata such as title, section, date,
  a source identifier or link, and optionally author, location, and named
  entities when extractable from the source.
- **Open Knowledge Record (OKF Record)**: The converted representation of an
  Archive Document, structured to Google's Open Knowledge Format and ready
  for submission to the Knowledge Catalog, carrying both the core fields
  (title, date, section, source identifier) and any extracted author,
  location, and named-entity metadata.
- **Knowledge Catalog Entry**: The published representation of an OKF
  Record inside Google's Knowledge Catalog, identified by a catalog entry
  identifier, versioned (with superseded versions retained and the latest
  surfaced by default), searchable via semantic/natural-language query with
  optional title/section/date filters, discoverable via Agent Search, and
  linked back to the original source document for download.
- **Pipeline Status**: The current lifecycle state of a document as it
  moves from imported through converted, published, and discoverable (or
  failed at any stage), along with a history of past attempts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An archivist can take a single archive document from
  selection through successful Knowledge Catalog publication in under 5
  minutes of active effort.
- **SC-002**: At least 95% of archive documents with complete metadata
  convert into a valid OKF record without manual correction.
- **SC-003**: At least 95% of conversion or publishing failures display an
  explanation specific enough that the archivist can determine the next
  step without contacting engineering support.
- **SC-004**: An archivist can determine the pipeline status of any
  document at a glance, with no document left in an unlabeled or ambiguous
  state.
- **SC-005**: Zero documents are published to the Knowledge Catalog more
  than once for the same source document *version*; corrected documents
  produce a new version rather than a duplicate entry of the same version.
- **SC-006**: A user can find a known published document via catalog search
  and successfully download its original source document in under 1
  minute.
- **SC-007**: At least 80% of natural-language catalog queries that
  describe a topic covered by a published document return that document
  within the first page of results, even when the query's wording does not
  exactly match the document's title or text.

## Assumptions

- "GMC archive" refers to the documents and metadata already catalogued for
  the Green Mountain Club (e.g., section newsletters and historical records
  such as those tracked in `GMC-Newsletter-List.md`), unless a different
  source system is identified during planning.
- Access to Google's Open Knowledge services (OKF submission, Knowledge
  Catalog, Agent Search) requires application-level credentials (such as a
  Google Cloud service account or OAuth2 client); the exact credential type
  is a planning-phase decision, not a scoping concern for this spec.
- This application is used by a small set of trusted GMC archivists rather
  than the general public; broad self-service signup is out of scope unless
  stated otherwise. Each user is assigned either the Viewer or Publisher
  role (see FR-001a); role assignment/management itself is a planning-phase
  concern (e.g., manually configured vs. self-service).
- The application is built as a standalone web app today, authenticating
  users via Google Sign-In, but is intended to later be embedded inside a
  WordPress plugin and authenticate users via their existing WordPress
  accounts instead (see FR-001b). The identity-provider abstraction this
  requires is a planning-phase architectural concern; this spec only
  requires that the swap be possible without functional regressions.
- The technology stack (TypeScript, React, ESLint, Jest, Playwright, Redux,
  TanStack Query, Ramda) and source layout (`src` folder, `@/src` path
  alias) requested by the user are implementation decisions that will be
  carried forward into the planning phase; they do not change the
  user-facing scope captured in this specification.
- Newly discoverable status in Agent Search may not be instantaneous after
  publishing; the system surfaces a pending state until discoverability is
  confirmed rather than guaranteeing a fixed delay.
- Client-side routing between the document browser, batch status, and
  history views will use React Router with a hash-based router for now, to
  maximize compatibility with simple static hosting; this routing choice is
  a planning-phase implementation detail and may be revisited later without
  changing the views required by FR-012.
- "Open Knowledge Format," "Knowledge Catalog," and "Agent Search" in this
  spec are functional names for capabilities realized by a Google-recommended
  cloud architecture (Cloud Storage for source documents, Document AI for
  OCR/text extraction/structured metadata, embeddings indexed in a vector
  search service for semantic catalog search, and an agent/search interface
  over that index). The specific product choices and how they're wired
  together are planning-phase decisions; this spec only fixes the
  user-facing behavior (convert, publish, version, search semantically,
  confirm discoverability, download original-format files).
- Expected document/query volume, data-residency/compliance requirements,
  and target processing accuracy were not specified by the user and are not
  scoped here; they are deferred to planning as operational/non-functional
  decisions that do not change this feature's user-facing requirements.
