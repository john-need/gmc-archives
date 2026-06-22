# Contract: GenerativeAnswerModel (`src/lib/search`)

Wraps Vertex AI Gemini (research.md §1). The backend (`src/backend/routes/ask.ts`)
is the only caller; the SPA never calls this directly. Has a fake/in-memory
counterpart used in all tests, proving the adapter boundary is real
(Constitution IV, matching feature 001's `google-services-adapter.md` pattern).

```ts
interface GroundingSource {
  archiveDocumentId: string;
  text: string; // retrieved snippet/body used as context
}

interface GenerativeAnswerModel {
  generate(question: string, sources: GroundingSource[]): Promise<{
    answer: string;
    citedDocumentIds: string[]; // subset of sources' archiveDocumentIds actually cited
  }>;
}
```

## Contract test requirements

1. `generate` with at least one source returns an `answer` that is a
   non-empty string and `citedDocumentIds` that is a subset of the
   `archiveDocumentId`s passed in `sources` — never an id not supplied.
2. `generate` with an empty `sources` array does not throw; it returns an
   answer indicating no grounding was available (mirrors feature 001's
   "no relevant matches" edge case) rather than fabricating one.
3. A model-call failure (timeout, error response) propagates as a thrown
   error, not a silently-empty success — the caller (`ask.ts`) is
   responsible for catching this and producing FR-004a's inline-error
   response; the model interface itself does not swallow failures.
4. `FakeGenerativeAnswerModel`'s output is deterministic for a given
   `(question, sources)` pair, so tests asserting on its output are not
   flaky.
