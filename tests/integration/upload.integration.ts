import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes, createDocumentUploadRoutes } from "@/backend/routes/documents";
import { createAskRoutes } from "@/backend/routes/ask";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import type { User } from "@/lib/types";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { user: User }).user = { id: "editor-1", role: "publisher", identityProvider: "google" };
    next();
  });
  const store = createMemoryStore();
  const documentStorage = createFakeDocumentStorage();
  const documentProcessor = createFakeDocumentProcessor({ body: "Trail maintenance notes from the upload." });
  const ingestionQueue = createFakeIngestionQueue();
  const catalogStore = createFakeCatalogStore();
  const semanticIndex = createFakeSemanticIndex();
  app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor, ingestionQueue }));
  app.use(createDocumentUploadRoutes({ store, documentStorage, documentProcessor, ingestionQueue, catalogStore, semanticIndex }));
  app.use(createAskRoutes({ store, catalogStore, semanticIndex, generativeAnswerModel: createFakeGenerativeAnswerModel() }));
  return { app, store };
}

describe("upload end-to-end through the fakes", () => {
  it("a .docx upload is visible in the Library and answerable from Ask & Search", async () => {
    const { app, store } = buildApp();
    const uploadResponse = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("fake docx bytes"), "trail-notes.docx");
    expect(uploadResponse.status).toBe(201);
    const { archiveDocumentId } = uploadResponse.body;
    expect(store.archiveDocuments.has(archiveDocumentId)).toBe(true);

    const documentResponse = await request(app).get(`/api/documents/${archiveDocumentId}`);
    expect(documentResponse.status).toBe(200);

    const askResponse = await request(app).post("/api/ask").send({ question: "Trail maintenance notes" });
    expect(askResponse.status).toBe(200);
    expect(askResponse.body.sources.some((s: { archiveDocumentId: string }) => s.archiveDocumentId === archiveDocumentId)).toBe(true);
  });

  it("a .csv upload is visible in the Library and answerable from Ask & Search", async () => {
    const { app, store } = buildApp();
    const uploadResponse = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("Name,Date\nTrail Report,1978"), "trail-data.csv");
    expect(uploadResponse.status).toBe(201);
    const { archiveDocumentId } = uploadResponse.body;
    expect(store.archiveDocuments.has(archiveDocumentId)).toBe(true);

    const askResponse = await request(app).post("/api/ask").send({ question: "Trail maintenance notes" });
    expect(askResponse.status).toBe(200);
    expect(askResponse.body.sources.some((s: { archiveDocumentId: string }) => s.archiveDocumentId === archiveDocumentId)).toBe(true);
  });
});
