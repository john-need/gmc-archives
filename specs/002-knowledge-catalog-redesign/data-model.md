# Phase 1 Data Model: Knowledge Catalog Redesign

Extends feature 001's data model (`specs/001-gmc-okf-ingestion/data-model.md`)
rather than replacing it. Only new entities and field-level changes to
existing entities are documented here; everything else (`OkfRecord`,
`CatalogEntry`, `PipelineStatus`, `AttemptRecord`, `Batch`) is unchanged.

## ArchiveDocument (extended)

Adds two `sourceFormat` values; everything else from feature 001 is
unchanged.

| Field | Type | Notes |
|---|---|---|
| `sourceFormat` | `"pdf" \| "scanned-image" \| "text" \| "markdown" \| "word" \| "spreadsheet"` | Adds `"word"` (`.doc`/`.docx`) and `"spreadsheet"` (`.xls`/`.xlsx`/`.csv`) per FR-010a (research.md §2). `resolveContentType` gains two corresponding cases: `"word"` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `"spreadsheet"` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. |

No new fields on `ArchiveDocument` itself: the Library view's "collection"
label is `section` re-labeled (spec.md Assumptions), not a new field.

## User (extended)

| Field | Type | Notes |
|---|---|---|
| `role` | `"viewer" \| "publisher"` | Unchanged values from feature 001; this feature only changes the *user-facing labels* ("Researcher"/"Editor") shown in the UI (FR-013), not the underlying role values, type, or any stored data. |

## Favorite

A signed-in user's bookmark of a document (spec: "Favorite", FR-007).

| Field | Type | Notes |
|---|---|---|
| `userId` | string | FK → `User.id` |
| `archiveDocumentId` | string | FK → `ArchiveDocument.id` |
| `favoritedAt` | timestamp | For stable list ordering in the Favorites view |

**Identity rule**: unique on `(userId, archiveDocumentId)` — toggling
favorite on an already-favorited document removes it rather than creating
a duplicate (FR-007). Modeled in the fake store as
`Map<userId, Set<archiveDocumentId>>` (research.md §3); a real store would
back this with a composite-key table/collection.

## AccessRequest

A prospective user's self-service request for access (spec: "Access
Request", FR-017–FR-019).

| Field | Type | Notes |
|---|---|---|
| `email` | string | Identity key; FR-017 enforces at most one `"pending"` request per email |
| `name` | string | Required |
| `affiliation` | string \| null | Optional |
| `reason` | string | Required |
| `status` | `"pending" \| "approved" \| "denied"` | FR-018/FR-019 drive transitions |
| `submittedAt` | timestamp | Updated (not duplicated) on resubmission while `"pending"` (FR-017) |
| `decidedAt` | timestamp \| null | Set when an Editor approves or denies |
| `decidedBy` | string \| null | FK → `User.id` (the Editor who acted), null while `"pending"` |

**Identity rule**: unique on `email`. Resubmitting while a request for
that email is `"pending"` updates the existing record in place
(`name`/`affiliation`/`reason`/`submittedAt`) rather than creating a
second one. Approving transitions `"pending"` → `"approved"` and
provisions a new `User` (role: `"viewer"`, i.e., Researcher by default);
denying transitions `"pending"` → `"denied"` with no `User` created.
Approving a request whose email is *already* a provisioned `User` is a
no-op against the existing account (edge case, spec.md) — the request
still transitions to `"approved"` for record-keeping, but no second
account is created.

## QaLogEntry (operational, not a domain entity)

Not part of the product's data model — a write-only structured-log record
satisfying FR-004b, sharing the same shape as feature 001's existing
`LogEntry` (`src/lib/logging.ts`), not a new persisted store.

| Field | Type | Notes |
|---|---|---|
| `question` | string | The user's submitted question |
| `retrievedDocumentIds` | string[] | `archiveDocumentId`s used to ground the answer |
| `answerLength` | number | Character count of the generated answer (not the answer text itself, to keep log volume bounded — research.md does not require full-answer retention) |
| `outcome` | `"success" \| "failure"` | Whether generation succeeded (ties to FR-004a's error path) |

This is emitted via `emitLogEntry` (feature 001) from the new `/api/ask`
route handler; it is explicitly *not* the same thing as the client-side
`Conversation` below, which the product never sends to a server-side
history store.

## Conversation (client-only, not persisted)

An ordered sequence of question/answer turns in the Ask & Search view
(spec: "Conversation"). Lives entirely in `conversationSlice` (Redux,
client-side); the backend never stores a `Conversation` as a queryable
entity — each turn the backend sees is request-scoped (the question in,
the answer + sources out, logged per `QaLogEntry` above, then forgotten by
the server).

| Field | Type | Notes |
|---|---|---|
| `messages` | `{ role: "user" \| "assistant"; text: string; sourceIds?: string[]; error?: boolean }[]` | Held only in Redux state |
| `draft` | string | Current unsent input text |
| `thinking` | boolean | True while an answer request is in flight |

## Relationships

```text
User 1 ── 0..* Favorite ── 1 ArchiveDocument
AccessRequest 0..1 ── 0..1 User (an approved request's email matches exactly one provisioned User)
ArchiveDocument (extended sourceFormat) — relationships otherwise unchanged from feature 001
Conversation (client-only) ── 0..* ArchiveDocument (via sourceIds, request-scoped only — no stored FK)
```
