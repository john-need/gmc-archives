# Contract: Google Services Adapter (`src/lib/storage`, `src/lib/conversion`, `src/lib/catalog`, `src/lib/search`)

Internal library interfaces wrapping Google Cloud products (research.md
§1–§3). The backend (`src/backend`) is the only caller; the SPA never sees
these directly. Every implementation below MUST have a fake/in-memory
counterpart used in contract tests, proving the adapter boundary is real
(Constitution IV, Integration Testing).

```ts
interface DocumentStorage {
  upload(file: Blob, meta: { archiveDocumentId: string }): Promise<{ storageObjectPath: string; version: number }>;
  download(archiveDocumentId: string, version?: number): Promise<{ stream: ReadableStream; contentType: string }>;
}

interface IngestionQueue {
  publish(job: { archiveDocumentId: string; version: number }): Promise<void>;
  // Subscriber side is internal to src/backend/ingestion; not exposed as a library call.
}

interface DocumentProcessor {
  extract(file: { stream: ReadableStream; sourceFormat: "pdf" | "scanned-image" | "text" | "markdown" }): Promise<{
    body: string;
    author: string | null;
    location: string | null;
    entities: string[];
    confidence: number;
  }>;
}

interface SemanticIndex {
  index(entry: { catalogEntryId: string; text: string }): Promise<{ embeddingId: string }>;
  query(q: string, filters?: { title?: string; section?: string; date?: string }): Promise<
    Array<{ catalogEntryId: string; score: number }>
  >;
  isQueryable(embeddingId: string): Promise<boolean>; // backs Agent Search discoverability (FR-004)
}
```

## Contract test requirements

For each interface, the same test suite runs against both the real Google-
backed implementation (against a test project/sandbox) and a fake
in-memory implementation:

1. `DocumentStorage.upload` followed by `download` returns the same bytes
   and `contentType` matches `sourceFormat`.
2. Uploading a corrected file for an existing `archiveDocumentId` increments
   `version` and does not delete the prior version's object (FR-007a).
3. `DocumentProcessor.extract` on a low-confidence/corrupted input returns a
   result whose `confidence` is low enough for the caller to mark the
   pipeline `"failed"` rather than silently accepting garbage text (FR-006,
   edge case).
4. `SemanticIndex.query` for a query with no relevant indexed entries
   returns `[]`, never throws (User Story 3 #3).
5. `SemanticIndex.isQueryable` returns `false` immediately after `index()`
   in the fake (simulating propagation delay) and `true` once the fake
   marks it ready — proving callers correctly surface `"pending"` vs.
   `"discoverable"` (User Story 4 #2).
