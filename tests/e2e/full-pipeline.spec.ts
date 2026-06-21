import { test, expect, request as playwrightRequest } from "@playwright/test";
import express from "express";
import type { Server } from "node:http";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createPublishRoutes } from "@/backend/routes/publish";
import { createCatalogRoutes } from "@/backend/routes/catalog";
import { createDiscoverabilityRoutes } from "@/backend/routes/discoverability";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { ArchiveDocument } from "@/lib/types";

// ponytail: no frontend bundler/dev server exists yet (plan.md never names
// one), so this exercises the same quickstart.md scenarios at the API level
// against a real Express instance rather than driving a browser. Upgrade to
// a browser-driven flow once src/app has a dev server to point Playwright at.

let server: Server;
let baseURL: string;
const documentStorage = createFakeDocumentStorage();
const store = createMemoryStore();
const catalogStore = createFakeCatalogStore();
const semanticIndex = createFakeSemanticIndex({ queryableAfterMs: 200 });

test.beforeAll(async () => {
  const document: ArchiveDocument = {
    id: "doc-e2e",
    title: "Trail Maintenance Report",
    section: "Field Reports",
    date: "1978-03-01",
    sourceFormat: "pdf",
    storageObjectPath: "doc-e2e/v1",
    version: 1,
    metadataComplete: true
  };
  store.archiveDocuments.set(document.id, document);
  await documentStorage.upload(new Blob(["source bytes"]), { archiveDocumentId: document.id });

  const app = express();
  app.use(express.json());
  app.use(
    createDocumentsRoutes({
      store,
      documentStorage,
      documentProcessor: createFakeDocumentProcessor({ body: "Trail maintenance notes from 1978" }),
      ingestionQueue: createFakeIngestionQueue()
    })
  );
  app.use(createPublishRoutes({ store, catalogStore, semanticIndex }));
  app.use(createCatalogRoutes({ store, catalogStore, semanticIndex, documentStorage }));
  app.use(createDiscoverabilityRoutes({ store, catalogStore, semanticIndex }));

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

test("full pipeline: convert -> publish/version -> search/download -> discoverability", async () => {
  const api = await playwrightRequest.newContext({ baseURL });

  const convertResponse = await api.post("/api/documents/doc-e2e/convert");
  expect(convertResponse.status()).toBe(200);

  const publishResponse = await api.post("/api/documents/doc-e2e/publish");
  expect(publishResponse.status()).toBe(200);
  const { catalogEntry } = await publishResponse.json();
  expect(catalogEntry.version).toBe(1);

  const duplicatePublish = await api.post("/api/documents/doc-e2e/publish");
  expect(duplicatePublish.status()).toBe(409);

  const searchResponse = await api.get("/api/catalog/search", { params: { q: "trail maintenance notes" } });
  expect(searchResponse.status()).toBe(200);
  const { results } = await searchResponse.json();
  expect(results).toHaveLength(1);

  const emptySearch = await api.get("/api/catalog/search", { params: { q: "completely unrelated topic" } });
  expect((await emptySearch.json()).results).toEqual([]);

  const downloadResponse = await api.get("/api/documents/doc-e2e/download");
  expect(downloadResponse.status()).toBe(200);
  expect(await downloadResponse.text()).toBe("source bytes");

  const firstDiscoverability = await api.get("/api/documents/doc-e2e/discoverability");
  expect((await firstDiscoverability.json()).status).toBe("pending");

  await new Promise((resolve) => setTimeout(resolve, 250));

  const secondDiscoverability = await api.get("/api/documents/doc-e2e/discoverability");
  expect((await secondDiscoverability.json()).status).toBe("discoverable");

  await api.dispose();
});
