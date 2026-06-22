import { createApp } from "@/backend/app";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";

// ponytail: no live GCP project is configured yet (T082), so this wires the
// same fakes the test suite uses instead of cloudStorageAdapter/
// documentAiProcessor/pubsubQueue/vectorSearchIndex/vertexGenerativeAnswerModel.
// Swap these for the real adapters (src/lib/storage/cloudStorageAdapter.ts
// etc.) once a project, bucket, topic, processor, vector index, and Gemini
// model are provisioned.
const store = createMemoryStore();
const documentStorage = createFakeDocumentStorage();
const documentProcessor = createFakeDocumentProcessor();
const ingestionQueue = createFakeIngestionQueue();
const catalogStore = createFakeCatalogStore();
const semanticIndex = createFakeSemanticIndex({ queryableAfterMs: 5000 });
const generativeAnswerModel = createFakeGenerativeAnswerModel();
const favoritesStore = createFakeFavoritesStore();
const accessRequestStore = createFakeAccessRequestStore();
const userDirectory = createFakeUserDirectory();

// ponytail: the dev server's own session still defaults to a static
// Publisher role (no userDirectory) for local-dev convenience — the
// access-request/approval workflow is fully wired and exercisable via the
// API below, it just isn't the gate for *this* process's own session.
const app = createApp({
  store,
  authProvider: createFakeAuthProvider({ role: "publisher" }),
  documentsDeps: { store, documentStorage, documentProcessor, ingestionQueue },
  publishDeps: { store, catalogStore, semanticIndex, conversionDeps: { documentStorage, documentProcessor, ingestionQueue } },
  catalogDeps: { store, catalogStore, semanticIndex, documentStorage },
  discoverabilityDeps: { store, catalogStore, semanticIndex },
  askDeps: { store, catalogStore, semanticIndex, generativeAnswerModel },
  favoritesDeps: { store, favoritesStore },
  uploadDeps: { store, documentStorage, documentProcessor, ingestionQueue, catalogStore, semanticIndex },
  accessRequestsDeps: { accessRequestStore, userDirectory },
  allowedOrigin: process.env.GMC_APP_ORIGIN ?? "http://localhost:5173"
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  process.stdout.write(`GMC backend listening on http://localhost:${port}\n`);
});
