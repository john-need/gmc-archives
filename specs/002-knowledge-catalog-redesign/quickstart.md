# Quickstart: Knowledge Catalog Redesign

Validation guide for this feature, on top of feature 001's existing
quickstart (`specs/001-gmc-okf-ingestion/quickstart.md`). See
[data-model.md](./data-model.md) and [contracts/](./contracts/) for the
shapes referenced below.

## Prerequisites

- Everything in feature 001's quickstart Prerequisites (Node.js 20 LTS,
  `npm install`, and — for the real (not fake) adapters only — a Google
  Cloud project with Cloud Storage/Pub/Sub/Document AI/vector search
  provisioned)
- For this feature's real `VertexGenerativeAnswerModel`: a Vertex AI Gemini
  model enabled in the same GCP project (not required to run against the
  fakes, which is the supported path in this environment per research.md)
- At least one `ArchiveDocument` already published (from feature 001's
  flow or this feature's Upload) to exercise Ask & Search and Favorites
  meaningfully

## Setup

```bash
npm install            # picks up @google-cloud/vertexai, mammoth, xlsx
npm run lint
npm run typecheck
```

## Run

Same two commands as feature 001 — this feature adds routes/views to the
same backend and SPA, it does not introduce a new process:

```bash
npm run dev:backend
npm run dev:app
```

## Validation scenarios

### 1. Ask the archive a question (User Story 1)

1. Sign in, land on the Ask & Search view (now the default route).
2. Click a suggested prompt, or type a question about an already-published
   document.
3. **Expect**: a "searching" indicator, then a generated answer with
   numbered citations; the same documents appear in the right-hand Sources
   panel (`POST /api/ask` → 200 with non-empty `sources`).
4. Ask something with no relevant published documents.
5. **Expect**: a best-effort answer, not an error (`sources: []` is a
   valid 200, never treated as failure).
6. Click "New chat".
7. **Expect**: the thread clears and the welcome state with suggested
   prompts reappears.

### 2. Simulate an Ask & Search failure (FR-004a)

1. With the fake `GenerativeAnswerModel` configured to throw (test-only
   toggle — see `tests/contract/generative-answer-model.contract.ts` for
   the pattern), submit a question.
2. **Expect**: `POST /api/ask` → 502 `ASK_FAILED`; the UI shows an inline
   error with a Retry action in the assistant's message slot, and the
   user's question remains visible in the thread.
3. Click Retry.
4. **Expect**: the same question is resubmitted (not duplicated in the
   thread) and either succeeds or shows the same error state again.

### 3. Browse and filter the Library (User Story 2)

1. Go to Library.
2. Type a search term; confirm the grid/list narrows live.
3. Select a collection chip; confirm only that collection's documents
   remain, and search text still applies on top of it.
4. Toggle grid ↔ list; confirm the same filtered set persists across the
   toggle.
5. Open a document; confirm the viewer shows preview/placeholder
   (PDF/image inline, Word/spreadsheet as a placeholder per FR-006),
   metadata, and Download/Favorite/"Ask about this document" actions.

### 4. Favorite and revisit (User Story 3)

1. From Library, favorite a document; confirm a toast confirmation and an
   immediate visual state change.
2. Go to Favorites; confirm it's listed.
3. Unfavorite it from the Favorites view; confirm it disappears and the
   empty state appears once no favorites remain.

### 5. Upload a new document (User Story 4)

1. As an Editor, go to Upload.
2. Drag a PDF onto the drop zone (or browse for one).
3. **Expect**: per-file progress to "indexed" (`POST /api/documents` →
   201); the file appears in Library and is answerable from Ask & Search
   without a manual refresh (SC-005).
4. Repeat with a `.docx` and a `.csv` file.
5. **Expect**: both succeed via the new word/spreadsheet text-extraction
   path (research.md §2), not Document AI.
6. Attempt to upload an unsupported format (e.g., `.exe`) and a file over
   50MB.
7. **Expect**: both rejected immediately (422 `UNSUPPORTED_FORMAT` /
   `FILE_TOO_LARGE`) before any progress bar appears.
8. As a Researcher, confirm Upload does not appear in navigation at all.

### 6. Sign in and request access, then approve it (User Story 5)

1. As an unprovisioned visitor, submit the request-access form with valid
   fields.
2. **Expect**: `POST /api/access-requests` → 200 `pending`; a confirmation
   screen naming the requester, with a path back to sign-in.
3. Resubmit the same email immediately.
4. **Expect**: the existing pending request is updated, not duplicated
   (`GET /api/access-requests` as an Editor still shows exactly one entry
   for that email).
5. As an Editor, open the pending-requests list and approve the request.
6. **Expect**: `POST /api/access-requests/:email/approve` → 200 with a
   `provisionedUserId`; the requester can now sign in successfully as a
   Researcher.
7. Submit a second request and deny it instead.
8. **Expect**: the denied visitor's next sign-in attempt is routed back to
   the request-access form, not granted any role.

### 7. CLI headless flows (Principle II)

```bash
npm run cli -- ask "When was the Long Trail completed?" --json
npm run cli -- favorite doc-123 --json
npm run cli -- request-access --name "A. Researcher" --email a@example.org --reason "Local history research" --json
npm run cli -- review-requests --json
```

**Expect**: same behavior as the UI, JSON output to stdout, errors to
stderr, exit code non-zero on any failure — identical contract to feature
001's existing CLI commands.

## Automated checks

```bash
npm test                # Jest: unit + component (src/lib, src/app) — now includes this feature's surfaces
npm run test:coverage   # same ≥90% gate as feature 001, re-run against the larger codebase
npm run test:e2e        # Playwright — extended with this feature's flows (ask, upload, favorites, access requests)
```
