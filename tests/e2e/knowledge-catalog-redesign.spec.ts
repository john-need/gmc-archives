import { test, expect, request as playwrightRequest } from "@playwright/test";
import express from "express";
import type { Server } from "node:http";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes, createDocumentUploadRoutes } from "@/backend/routes/documents";
import { createAskRoutes } from "@/backend/routes/ask";
import { createFavoritesRoutes } from "@/backend/routes/favorites";
import { createAccessRequestsRoutes } from "@/backend/routes/accessRequests";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";
import type { User } from "@/lib/types";

// ponytail: same rationale as feature 001's e2e suite — no browser-driven
// dev server is wired into Playwright yet, so this exercises the
// quickstart.md scenarios at the API level against a real Express instance.

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
  const store = createMemoryStore();
  const documentStorage = createFakeDocumentStorage();
  const documentProcessor = createFakeDocumentProcessor({ body: "Trail maintenance notes from the upload." });
  const ingestionQueue = createFakeIngestionQueue();
  const catalogStore = createFakeCatalogStore();
  const semanticIndex = createFakeSemanticIndex();
  const generativeAnswerModel = createFakeGenerativeAnswerModel();
  const favoritesStore = createFakeFavoritesStore();
  const accessRequestStore = createFakeAccessRequestStore();
  const userDirectory = createFakeUserDirectory();

  const app = express();
  app.use(express.json());
  const editor: User = { id: "editor-1", role: "publisher", identityProvider: "google" };
  app.use((req, _res, next) => {
    (req as express.Request & { user: User }).user = editor;
    next();
  });
  app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor, ingestionQueue }));
  app.use(createDocumentUploadRoutes({ store, documentStorage, documentProcessor, ingestionQueue, catalogStore, semanticIndex }));
  app.use(createAskRoutes({ store, catalogStore, semanticIndex, generativeAnswerModel }));
  app.use(createFavoritesRoutes({ store, favoritesStore }));
  app.use(createAccessRequestsRoutes({ accessRequestStore, userDirectory }));

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

test("full pipeline: upload -> ask -> favorite -> access-request approval", async () => {
  const api = await playwrightRequest.newContext({ baseURL });

  const uploadResponse = await api.post("/api/documents", {
    multipart: { file: { name: "trail-notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("fake pdf bytes") } }
  });
  expect(uploadResponse.status()).toBe(201);
  const { archiveDocumentId } = await uploadResponse.json();

  const askResponse = await api.post("/api/ask", { data: { question: "Trail maintenance notes" } });
  expect(askResponse.status()).toBe(200);
  const askBody = await askResponse.json();
  expect(askBody.sources.some((s: { archiveDocumentId: string }) => s.archiveDocumentId === archiveDocumentId)).toBe(true);

  const favoriteResponse = await api.post(`/api/favorites/${archiveDocumentId}`);
  expect(favoriteResponse.status()).toBe(200);
  const favoritesListResponse = await api.get("/api/favorites");
  expect((await favoritesListResponse.json()).documents).toHaveLength(1);

  const requestResponse = await api.post("/api/access-requests", {
    data: { name: "A One", email: "a@example.org", reason: "Local history research" }
  });
  expect(requestResponse.status()).toBe(200);
  const approveResponse = await api.post("/api/access-requests/a@example.org/approve");
  expect(approveResponse.status()).toBe(200);
  expect((await approveResponse.json()).provisionedUserId).toBe("a@example.org");

  await api.dispose();
});
