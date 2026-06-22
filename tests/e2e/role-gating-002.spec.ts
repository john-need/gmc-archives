import { test, expect, request as playwrightRequest } from "@playwright/test";
import express from "express";
import type { Server } from "node:http";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentUploadRoutes } from "@/backend/routes/documents";
import { createAccessRequestsRoutes } from "@/backend/routes/accessRequests";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";
import type { User } from "@/lib/types";

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
  const store = createMemoryStore();
  const documentStorage = createFakeDocumentStorage();
  const documentProcessor = createFakeDocumentProcessor();
  const ingestionQueue = createFakeIngestionQueue();
  const catalogStore = createFakeCatalogStore();
  const semanticIndex = createFakeSemanticIndex();
  const accessRequestStore = createFakeAccessRequestStore();
  const userDirectory = createFakeUserDirectory();
  await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const role = req.header("x-test-role") ?? "viewer";
    const user: User = { id: "test-user", role: role as User["role"], identityProvider: "google" };
    (req as express.Request & { user: User }).user = user;
    next();
  });
  app.use(createDocumentUploadRoutes({ store, documentStorage, documentProcessor, ingestionQueue, catalogStore, semanticIndex }));
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

test("a Researcher cannot upload or manage access requests", async () => {
  const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-test-role": "viewer" } });

  const uploadResponse = await api.post("/api/documents", {
    multipart: { file: { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("bytes") } }
  });
  expect(uploadResponse.status()).toBe(403);

  const listResponse = await api.get("/api/access-requests");
  expect(listResponse.status()).toBe(403);

  const approveResponse = await api.post("/api/access-requests/a@example.org/approve");
  expect(approveResponse.status()).toBe(403);

  await api.dispose();
});

test("an Editor can upload and manage access requests", async () => {
  const api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { "x-test-role": "publisher" } });

  const uploadResponse = await api.post("/api/documents", {
    multipart: { file: { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 bytes") } }
  });
  expect(uploadResponse.status()).toBe(201);

  const listResponse = await api.get("/api/access-requests");
  expect(listResponse.status()).toBe(200);

  const approveResponse = await api.post("/api/access-requests/a@example.org/approve");
  expect(approveResponse.status()).toBe(200);

  await api.dispose();
});
