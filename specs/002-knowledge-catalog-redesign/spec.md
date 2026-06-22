# Feature Specification: Knowledge Catalog Redesign

**Feature Branch**: `002-knowledge-catalog-redesign`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "refactor the routes and ui to match the designs in folder designs/Google Knowledge Catalog UI"

## Clarifications

### Session 2026-06-21

- Q: Does "Ask & Search" require real generative AI answer synthesis (an
  LLM composing prose from retrieved sources), or just templated/extractive
  answers built from retrieved snippets? → A: Real generative AI — an LLM
  composes the answer text from retrieved, grounded sources (RAG).
- Q: The design's Upload view advertises PDF, Word, HTML, Images, and
  Spreadsheets up to 50MB, but the prior feature only supports
  pdf/scanned-image/text/markdown — expand formats to match the design? →
  A: Expand to match the design — add Word and Spreadsheet formats and
  enforce a 50MB per-file size cap.
- Q: How should Ask & Search behave when the retrieval/generative-answer
  service itself fails or times out (distinct from "no relevant matches")?
  → A: Show an inline error in the assistant message slot with a retry
  action; keep the user's question in the thread rather than discarding it.
- Q: Is conversation history persisted server-side per user across
  sessions/devices, or ephemeral (browser-only, cleared on reload/"New
  chat")? → A: Ephemeral, session-only — no server-side conversation
  storage; matches the reference design (no history UI).
- Q: Are all documents visible to every signed-in user regardless of role,
  or do document-level visibility restrictions exist that Library browsing
  and Ask & Search retrieval/citations must respect per-user? → A: All
  documents are visible to every signed-in user; Researcher vs. Editor
  differ only in capabilities (Upload, approving access requests), never
  in document visibility.
- Q: Should individual question/answer exchanges be logged server-side for
  abuse monitoring or answer-quality review, even though conversations
  themselves are ephemeral (not a user-facing history feature)? → A: Yes —
  log each question, retrieved sources, and generated answer to structured
  logs (operational record, not a conversation-history feature).
- Q: For formats browsers can't render natively (Word, spreadsheets),
  should the document viewer attempt an inline rendered preview, or show a
  placeholder and rely on download? → A: Placeholder (icon + filename +
  metadata) for non-native formats; PDF and images still render inline. No
  new document-conversion pipeline.
- Q: Should this feature include rate limiting on Ask & Search submissions
  given real per-request generative-AI cost/abuse potential? → A: Defer to
  later — no rate limiting in this feature; the user base is small and
  trusted per the prior feature's scale assumptions.
- Q: Should the Library view paginate/virtualize results, or render the
  full filtered set at once, given the archive can hold hundreds to
  low-thousands of documents? → A: Render the full filtered set, no
  pagination — matches the reference design; revisit only if real catalog
  size requires it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask the Archive a Question (Priority: P1)

A signed-in user opens the app to an "Ask & Search" view and asks a
plain-language question about the archive (e.g., "When was the Long Trail
completed?"). The system responds with a grounded answer and a numbered list
of source documents the user can open or download, matching the layout and
visual style of the provided design (chat-style question/answer thread,
welcome state with suggested prompts, "Sources" panel alongside the
conversation).

**Why this priority**: This is the primary entry point in the new design —
the default route users land on — and replaces the current structured
search form as the main way people interact with the catalog.

**Independent Test**: Sign in, ask a question from the welcome screen's
suggested prompts (or type a custom one), and verify a grounded answer
appears with at least one openable, numbered source — independent of the
Library, Favorites, or Upload views.

**Acceptance Scenarios**:

1. **Given** a signed-in user on an empty "Ask & Search" view, **When** they
   submit a question, **Then** a "searching" indicator appears followed by
   an answer with numbered source citations, and the same sources appear in
   the right-hand Sources panel.
2. **Given** an answer with sources is showing, **When** the user clicks a
   source citation or a Sources-panel entry, **Then** the corresponding
   document opens in the document viewer.
3. **Given** a question with no relevant matches, **When** the user submits
   it, **Then** the system returns its best-effort closest matches rather
   than an error, and says so plainly.
4. **Given** an active conversation, **When** the user clicks "New chat",
   **Then** the conversation clears and the welcome state reappears.
5. **Given** the retrieval or answer-generation service fails or times out,
   **When** a user submits a question, **Then** the assistant's message
   slot shows an inline error with a retry action, the user's question
   remains visible in the thread, and retrying re-attempts only that
   question without duplicating it.

---

### User Story 2 - Browse and Filter the Library (Priority: P1)

A signed-in user switches to the "Library" view to browse the full catalog,
filter by collection, switch between grid and list layouts, and open or
download any document directly — independent of asking a question first.

**Why this priority**: Browsing without first knowing what to ask is a core
need (matches existing User Story 1 of the prior feature) and is one of the
four primary navigation destinations in the new design.

**Independent Test**: Sign in, go to Library, filter to one collection,
switch view modes, and open/download a document — independent of the
Ask & Search or Favorites views.

**Acceptance Scenarios**:

1. **Given** the Library view, **When** the user types in the search box,
   **Then** the list narrows to documents whose title, collection, or
   summary match, updating as they type.
2. **Given** the Library view, **When** the user selects a collection chip
   (e.g., "Long Trail News"), **Then** only documents in that collection are
   shown, and selecting "All" clears the filter.
3. **Given** filtered results, **When** the user toggles between grid and
   list layout, **Then** the same filtered set re-renders in the chosen
   layout without losing the active filter or search text.
4. **Given** a document card or row, **When** the user clicks "View",
   **Then** the document viewer opens with its metadata, preview, and
   actions (download, ask about this document, favorite).
5. **Given** no documents match the current filter and search text,
   **When** the list renders, **Then** an explicit "no documents match"
   message is shown instead of an empty blank area.

---

### User Story 3 - Save and Revisit Favorites (Priority: P2)

A signed-in user bookmarks documents they care about from the Library, a
search result, or the document viewer, and later revisits them from a
dedicated Favorites view.

**Why this priority**: Favorites is a net-new convenience capability shown
throughout the new design (Library cards, Sources panel, document viewer)
that makes repeat research faster, but the catalog remains fully usable
without it.

**Independent Test**: From the Library, favorite a document, navigate to
Favorites, confirm it appears, then unfavorite it and confirm it disappears
from Favorites — independent of Ask & Search or Upload.

**Acceptance Scenarios**:

1. **Given** any document card, row, search source, or open document viewer,
   **When** the user toggles its favorite control, **Then** the control's
   state updates immediately everywhere that document appears, and a brief
   confirmation message is shown.
2. **Given** the Favorites view with at least one favorited document,
   **When** it renders, **Then** all currently favorited documents are
   listed with the same actions available as in the Library.
3. **Given** the Favorites view with no favorited documents, **When** it
   renders, **Then** an empty state explains how to add favorites and links
   back to the Library.

---

### User Story 4 - Publish New Documents into the Catalog (Priority: P2)

A user with upload permission adds one or more files to the catalog by
dragging them onto an upload area (or browsing for them), sees per-file
upload progress, and the documents become searchable/askable once
processing completes — without leaving the Upload view.

**Why this priority**: This is the redesigned entry point for the prior
feature's conversion/publish workflow (Convert → Publish), now presented as
a single drag-and-drop upload step instead of a multi-step batch flow. It is
P2 because browsing and asking questions about already-published documents
delivers value without it.

**Independent Test**: As a user with upload permission, drag a file onto
the upload area, watch its progress reach "indexed," and confirm it now
appears in the Library and is answerable from Ask & Search — independent of
Favorites or prior conversion state.

**Acceptance Scenarios**:

1. **Given** the Upload view, **When** a user with upload permission drags a
   file over the drop area, **Then** the drop area's appearance changes to
   indicate it is ready to accept the file.
2. **Given** a dropped or browsed file, **When** upload begins, **Then** a
   progress indicator for that specific file advances and ends in an
   "indexed" state, after which the file appears in the Library and is
   eligible to ground future answers.
3. **Given** a user without upload permission, **When** they view the
   navigation, **Then** no Upload destination is shown to them at all.

---

### User Story 5 - Sign In and Request Access (Priority: P3)

A new visitor signs in with their existing Google account if already
provisioned, or submits a request-access form (name, email, optional
affiliation, reason) if not. The request is recorded and stays pending
until an Editor reviews it; the visitor sees confirmation that their
request was received and is awaiting manual approval.

**Why this priority**: This affects only first-time/unprovisioned visitors
and the Editors who review requests, not the day-to-day experience of
already-provisioned users, so it is lowest priority even though it is the
literal entry point of the design.

**Independent Test**: As an unprovisioned visitor, open the request-access
form, submit valid required fields, and confirm a "request submitted"
confirmation appears; separately, as an Editor, confirm the same request is
visible in a pending-requests list and can be approved or denied —
independent of any other authenticated-area functionality.

**Acceptance Scenarios**:

1. **Given** the sign-in screen, **When** a visitor clicks "Continue with
   Google" and the resulting account is provisioned, **Then** they land on
   the Ask & Search view with their assigned role applied.
2. **Given** the request-access form, **When** a visitor submits it with a
   missing required field (name, email, or reason) or an invalid email,
   **Then** a validation message is shown and the form is not submitted.
3. **Given** a valid request-access submission, **When** it is submitted,
   **Then** it is recorded as pending, a confirmation message is shown by
   name with a path back to sign-in, and the visitor is told approval is
   manual and may take several days.
4. **Given** an Editor viewing pending access requests, **When** they
   approve one, **Then** the requester becomes a provisioned user (as a
   Researcher by default) and can subsequently sign in successfully with
   the email/account they requested with.
5. **Given** an Editor viewing pending access requests, **When** they deny
   one, **Then** the request is marked denied, removed from the pending
   list, and the requester's later sign-in attempt is treated as
   unprovisioned (i.e., routed back to the request-access form, not
   silently re-queued).

---

### Edge Cases

- What happens when a question is asked while a previous answer is still
  generating? The system MUST queue or block concurrent sends until the
  in-flight answer completes, never interleaving two answers.
- What happens when the retrieval or answer-generation service fails or
  times out (distinct from a successful "no relevant matches" response)?
  The system MUST show an inline error with a retry action in place of the
  answer, preserve the user's question in the thread, and MUST NOT show a
  fabricated or silently-empty answer.
- How does the system handle a document being deleted while it is open in
  the viewer, queued in a search result, or favorited by another active
  session? The viewer/result MUST degrade to a clear "no longer available"
  state rather than erroring silently.
- What happens when an uploaded file fails processing (e.g., corrupted,
  unsupported format)? The per-file progress indicator MUST show a failure
  state with an actionable message rather than appearing to hang.
- What happens when a dropped/browsed file is not one of the accepted
  formats (FR-010a) or exceeds 50MB (FR-010b)? The file MUST be rejected
  immediately, before any upload progress begins, with a message naming
  the specific reason (unsupported format vs. too large).
- What happens when a user without upload permission somehow navigates
  directly to the Upload route? They MUST be redirected away from it (same
  enforcement as any other permission-gated route).
- What happens when the request-access form is submitted twice in a row?
  Resubmission MUST NOT create duplicate pending requests for the same
  email; a second submission while one is already pending MUST be treated
  as an update to the existing pending request, not a new one.
- What happens when someone whose request was denied tries to sign in
  again? They MUST be routed back to the request-access flow as an
  unprovisioned visitor, not auto-approved or shown a stale "pending"
  state.
- What happens when an Editor approves a request for an email that is
  already provisioned (e.g., a duplicate request)? The system MUST treat
  this as a no-op against the existing account rather than creating a
  second account or erroring.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present four primary destinations to a
  signed-in, provisioned user: Ask & Search, Library, Favorites, and
  (permission-gated) Upload, navigable from a persistent side panel showing
  the signed-in user's name and role.
- **FR-002**: The system MUST support a conversational question/answer
  interaction as the primary search experience: a user submits a
  plain-language question, the system retrieves relevant catalog documents,
  and a generative model composes a prose answer grounded in those
  retrieved documents, with numbered citations linking back to them. The
  answer MUST NOT assert facts beyond what the retrieved sources support.
- **FR-003**: The system MUST display, alongside an active conversation, the
  list of source documents grounding the most recent answer, each openable
  and downloadable from that list.
- **FR-004**: The system MUST let a user start a new conversation, clearing
  the current thread without affecting catalog data.
- **FR-004a**: The system MUST show an inline, retryable error in place of
  an answer when the retrieval or answer-generation service fails or times
  out, preserving the user's question in the thread and never fabricating
  an answer in its place.
- **FR-004b**: The system MUST write each question, the documents
  retrieved to ground it, and the generated answer to structured
  operational logs (for abuse monitoring and answer-quality review) even
  though conversations are not retained as a user-facing history feature
  (FR-004's ephemeral, client-only thread is unaffected by this logging).
- **FR-005**: The system MUST provide a Library view listing all documents
  the user is permitted to see, filterable by free-text search and by a
  single collection at a time, and viewable in either a grid or a list
  layout. The full filtered result set renders at once, without
  pagination, consistent with the reference design.
- **FR-006**: The system MUST let a user open a document viewer showing the
  document's preview, summary, and metadata (date, owner, size, collection),
  with actions to download it, favorite/unfavorite it, and start a new
  conversation pre-focused on that document. PDF and image documents
  render an inline preview; documents in formats that cannot be rendered
  inline (Word, spreadsheets) show a type icon and filename placeholder
  instead, with the same metadata and actions still available.
- **FR-007**: The system MUST let any signed-in user favorite or unfavorite
  any document they can view, from the Library, search sources, or the
  document viewer, with the favorited state reflected consistently
  everywhere that document is shown.
- **FR-008**: The system MUST provide a Favorites view listing only the
  current user's favorited documents, with an empty state guiding the user
  back to the Library when there are none.
- **FR-009**: The system MUST restrict the Upload destination and its
  underlying capability to users holding upload permission; users without
  it MUST NOT see the destination in navigation or be able to reach its
  functionality directly.
- **FR-010**: The system MUST let a permitted user upload one or more files
  via drag-and-drop or a file browser, show per-file progress through to an
  "indexed" completion state, and make each successfully indexed file
  immediately available in the Library and answerable from Ask & Search.
- **FR-010a**: The system MUST accept PDF, Word (.doc/.docx), scanned
  images, plain text/markdown, and spreadsheet (.xls/.xlsx/.csv) files as
  upload source formats — an expansion of the prior feature's four
  supported formats (FR-002a) to match the design — and MUST reject any
  other format with a clear, actionable message before upload begins.
- **FR-010b**: The system MUST reject any file larger than 50MB before
  upload begins, with a clear, actionable message stating the limit.
- **FR-011**: The system MUST show a brief, non-blocking confirmation
  message after key actions (favorite/unfavorite, download, delete, upload
  completion) consistent with the design's toast pattern.
- **FR-012**: The system MUST require sign-in before any of the four primary
  destinations are reachable, presenting a sign-in screen for unauthenticated
  visitors.
- **FR-013**: The system MUST preserve the existing Viewer/Publisher
  permission model (FR-001a of the prior feature) when enforcing what each
  user can see and do across all five views, using "Researcher" and
  "Editor" as the user-facing labels for Viewer and Publisher respectively.
  The Researcher/Editor distinction governs *capabilities* only (Upload,
  reviewing access requests) — every signed-in user, regardless of role,
  can see and retrieve every document in Library, Favorites, and
  Ask & Search; there is no document-level visibility restriction.
- **FR-014**: The system MUST preserve the prior feature's identity-provider
  abstraction (FR-001b) — Google Sign-In today — without coupling the new
  UI to a specific provider's implementation.
- **FR-015**: The system MUST preserve original-format document download
  (FR-014 of the prior feature) from the Library, document viewer, and
  Sources panel alike.
- **FR-016**: The system MUST preserve version/supersede semantics (FR-007a
  of the prior feature) so that the Library, Favorites, and search/ask
  results show only the current version of a document by default.
- **FR-017**: The system MUST persist each access request (name, email,
  optional affiliation, reason, submitted timestamp, status) and prevent a
  second pending request for the same email from being created; resubmission
  while pending MUST update the existing pending request instead.
- **FR-018**: The system MUST let an Editor view all pending access
  requests and approve or deny each one; approving a request MUST
  provision a new user (role: Researcher by default) usable for sign-in,
  and denying MUST mark the request denied without provisioning anything.
- **FR-019**: The system MUST treat a denied or never-submitted visitor's
  sign-in attempt as unprovisioned, routing them to the request-access
  form rather than granting any role.

### Key Entities *(include if feature involves data)*

- **Conversation**: An ordered sequence of user questions and grounded
  answers in the Ask & Search view, held only in client-side session state
  — never persisted as a user-facing history feature, and cleared on "New
  chat" or page reload; each answer references zero or more source
  documents. (Distinct from the operational Q&A log entry created per
  FR-004b, which is a write-only operational record, not a queryable
  "Conversation" the user or product can browse.)
- **Favorite**: An association between a signed-in user and a document they
  have bookmarked; one user's favorites are not visible to other users.
- **Access Request**: A prospective user's submitted name, email, optional
  affiliation, and reason for access; carries a status of `"pending"`,
  `"approved"`, or `"denied"` and a submitted timestamp. Approving one
  provisions a new `User` (FR-018); at most one pending request may exist
  per email at a time (FR-017).
- **Document** *(carried over from the prior feature's `ArchiveDocument` /
  `OkfRecord` / `CatalogEntry`)*: Gains a user-facing "collection" grouping
  (e.g., "Long Trail News", "Maps", "Photos") for Library filtering, shown
  alongside its existing title, type, date, and size metadata. Its source
  format set expands to include Word and spreadsheet formats (FR-010a) in
  addition to the prior feature's pdf/scanned-image/text/markdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can ask a question and receive a grounded, sourced
  answer in under 5 seconds of perceived wait (excluding network/model
  latency outliers), with a visible "searching" indicator throughout.
- **SC-002**: A user can find and open a specific known document via either
  Ask & Search or Library filtering in under 30 seconds.
- **SC-003**: 100% of documents reachable from Library, Favorites, or
  Ask & Search results can be opened in the document viewer and downloaded
  in their original format without error.
- **SC-004**: A user without upload permission never sees the Upload
  destination, verified across all four other views and the navigation
  panel.
- **SC-005**: An uploaded, successfully indexed file is answerable from
  Ask & Search and visible in the Library within the same session, with no
  manual refresh required.
- **SC-006**: Favoriting/unfavoriting a document updates its visual state
  in under 1 second everywhere it is displayed, without a full page reload.
- **SC-007**: An Editor can review and act on a pending access request
  (approve or deny) in under 1 minute, and the requester's next sign-in
  attempt immediately reflects that decision.

## Assumptions

- "Editor" and "Researcher" in the design are presentation-layer renames of
  the prior feature's "Publisher" and "Viewer" roles respectively, not a
  new third/fourth role — the underlying permission model (FR-001a) is
  unchanged, only its user-facing labels and the routes gated by it change.
- The chat-style "Ask & Search" experience replaces the prior feature's
  structured search-with-filters UI as the *primary* interaction. The
  underlying semantic search capability (FR-013 of the prior feature) is
  reused as the retrieval step; a generative model is newly introduced on
  top of that retrieval to compose the prose answer (FR-002) — this is new
  scope beyond the prior feature's search/ranking logic, not a pure
  front-end reskin.
- "Collections" in the new Library view correspond to the prior feature's
  `section` field (e.g., a newsletter's section name); no new taxonomy or
  hierarchy beyond a flat, single-select grouping is in scope.
- The document viewer's "Ask about this document" action starts a new
  Ask & Search conversation pre-seeded with a question referencing that
  document, reusing the existing conversational flow rather than a separate
  per-document chat.
- Upload in this feature is the user-facing replacement for the prior
  feature's "convert" step; published/indexed status still flows through
  the existing pipeline stages. The front-end presentation changes
  (drag-drop with progress) and the set of accepted source formats expands
  (FR-010a/FR-010b) — both are in scope, not front-end-only.
- Visual styling (colors, typography, spacing, iconography) follows the
  reference design's look and feel; exact pixel-for-pixel parity is not
  required, but the layout structure, navigation model, and interaction
  patterns described above are.
- The reference design's sample data (collections, documents, suggested
  prompts) is illustrative only and not a content requirement — the
  feature must work with the GMC archive's real catalog content.
- Access-request approval is performed by existing Editors (Publishers);
  no new "Admin" role is introduced. The design's "workspace admin" framing
  maps onto whoever already holds the Editor/Publisher role, consistent
  with the existing two-role model (FR-001a) and avoiding a speculative
  third role with no other use in this feature.
- An approved request provisions a Researcher (Viewer) by default; granting
  Editor (Publisher) access to a newly approved user remains a separate,
  out-of-band administrative action (e.g., role allowlist update), not a
  choice made at approval time in this feature.
- Rate limiting/throttling of Ask & Search submissions is explicitly out of
  scope for this feature, given the small, trusted user base assumed by
  the prior feature; revisit only if real-world usage or cost patterns
  warrant it.
- Document-level visibility is uniform: every signed-in user (Researcher or
  Editor) can see, search, and be cited every document; the role
  distinction governs capabilities (Upload, access-request approval) only,
  never document visibility.
