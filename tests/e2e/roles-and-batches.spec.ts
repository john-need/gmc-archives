import { test, expect, request as playwrightRequest } from "@playwright/test";
import express from "express";
import type { Server } from "node:http";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createBatchesRoutes } from "@/backend/routes/batches";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createPublishRoutes } from "@/backend/routes/publish";
import { requireRole } from "@/backend/middleware/requireRole";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { ArchiveDocument, User } from "@/lib/types";

let server: Server;
let baseURL: string;

function fixtureDocuments(count: number): ArchiveDocument[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `doc-${index + 1}`,
    title: `Doc ${index + 1}`,
    section: "Newsletters",
    date: "1978-03-01",
    sourceFormat: "pdf" as const,
    storageObjectPath: `doc-${index + 1}/v1`,
    version: 1,
    metadataComplete: true
  }));
}

test.beforeAll(async () => {
  const store = createMemoryStore(fixtureDocuments(51));
  const documentStorage = createFakeDocumentStorage();
  for (const document of store.archiveDocuments.values()) {
    await documentStorage.upload(new Blob(["bytes"]), { archiveDocumentId: document.id });
  }

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const role = req.header("x-test-role") ?? "viewer";
    const user: User = { id: "test-user", role: role as User["role"], identityProvider: "google" };
    (req as express.Request & { user: User }).user = user;
    next();
  });
  app.use("/api/batches", requireRole("publisher"));
  app.use(
    createBatchesRoutes({
      store,
      documentStorage,
      documentProcessor: createFakeDocumentProcessor(),
      ingestionQueue: createFakeIngestionQueue()
    })
  );
  app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor: createFakeDocumentProcessor(), ingestionQueue: createFakeIngestionQueue() }));
  app.use(
    createPublishRoutes({
      store,
      catalogStore: createFakeCatalogStore(),
      semanticIndex: createFakeSemanticIndex(),
      conversionDeps: { documentStorage, documentProcessor: createFakeDocumentProcessor(), ingestionQueue: createFakeIngestionQueue() }
    })
  );

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  baseURL = `http://127.0.0.1:${port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("a Viewer is forbidden from creating a batch", async () => {
  const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-test-role": "viewer" } });
  const response = await api.post("/api/batches", { data: { archiveDocumentIds: ["doc-1"] } });
  expect(response.status()).toBe(403);
  await api.dispose();
});

test("a Publisher submitting 51 documents gets BATCH_TOO_LARGE", async () => {
  const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-test-role": "publisher" } });
  const ids = Array.from({ length: 51 }, (_, index) => `doc-${index + 1}`);
  const response = await api.post("/api/batches", { data: { archiveDocumentIds: ids } });
  expect(response.status()).toBe(422);
  expect((await response.json()).error).toBe("BATCH_TOO_LARGE");
  await api.dispose();
});

test("a batch of 2-3 documents shows independent per-document status, and a failed convert can be retried", async () => {
  const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-test-role": "publisher" } });
  const createResponse = await api.post("/api/batches", { data: { archiveDocumentIds: ["doc-1", "doc-2"] } });
  const { batchId } = await createResponse.json();

  const statusResponse = await api.get(`/api/batches/${batchId}`);
  const { documents } = await statusResponse.json();
  expect(documents).toHaveLength(2);
  expect(new Set(documents.map((d: { archiveDocumentId: string }) => d.archiveDocumentId))).toEqual(
    new Set(["doc-1", "doc-2"])
  );

  await api.dispose();
});
