import { createApp } from "@/backend/app";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";

// ponytail: no live GCP project is configured yet (T082), so this wires the
// same fakes the test suite uses instead of cloudStorageAdapter/
// documentAiProcessor/pubsubQueue/vectorSearchIndex. Swap these for the real
// adapters (src/lib/storage/cloudStorageAdapter.ts etc.) once a project,
// bucket, topic, processor, and vector index are provisioned.
const store = createMemoryStore();
const documentStorage = createFakeDocumentStorage();
const documentProcessor = createFakeDocumentProcessor();
const ingestionQueue = createFakeIngestionQueue();
const catalogStore = createFakeCatalogStore();
const semanticIndex = createFakeSemanticIndex({ queryableAfterMs: 5000 });

const app = createApp({
  store,
  authProvider: createFakeAuthProvider({ role: "publisher" }),
  documentsDeps: { store, documentStorage, documentProcessor, ingestionQueue },
  publishDeps: { store, catalogStore, semanticIndex, conversionDeps: { documentStorage, documentProcessor, ingestionQueue } },
  catalogDeps: { store, catalogStore, semanticIndex, documentStorage },
  discoverabilityDeps: { store, catalogStore, semanticIndex },
  allowedOrigin: process.env.GMC_APP_ORIGIN ?? "http://localhost:5173"
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  process.stdout.write(`GMC backend listening on http://localhost:${port}\n`);
});
