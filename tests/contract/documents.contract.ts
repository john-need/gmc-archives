import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import type { ArchiveDocument } from "@/lib/types";

function fixtureDocument(overrides: Partial<ArchiveDocument> = {}): ArchiveDocument {
  return {
    id: "doc-1",
    title: "GMC Newsletter Spring 1978",
    section: "Newsletters",
    date: "1978-03-01",
    sourceFormat: "pdf",
    storageObjectPath: "doc-1/v1",
    version: 1,
    metadataComplete: true,
    ...overrides
  };
}

function buildApp(documents: ArchiveDocument[]): express.Express {
  const app = express();
  app.use(express.json());
  const store = createMemoryStore(documents);
  app.use(
    createDocumentsRoutes({
      store,
      documentStorage: createFakeDocumentStorage(),
      documentProcessor: createFakeDocumentProcessor(),
      ingestionQueue: createFakeIngestionQueue()
    })
  );
  return app;
}

describe("GET /api/documents", () => {
  it("lists archive documents", async () => {
    const app = buildApp([fixtureDocument()]);
    const response = await request(app).get("/api/documents");
    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].id).toBe("doc-1");
  });

  it("filters by section", async () => {
    const app = buildApp([fixtureDocument(), fixtureDocument({ id: "doc-2", section: "Field Reports" })]);
    const response = await request(app).get("/api/documents").query({ section: "Field Reports" });
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].id).toBe("doc-2");
  });

  it("filters by title substring (q), case-insensitively", async () => {
    const app = buildApp([fixtureDocument(), fixtureDocument({ id: "doc-2", title: "Trail Report" })]);
    const response = await request(app).get("/api/documents").query({ q: "trail" });
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].id).toBe("doc-2");
  });
});

describe("GET /api/documents/:id", () => {
  it("fetches one archive document's current-version metadata", async () => {
    const app = buildApp([fixtureDocument()]);
    const response = await request(app).get("/api/documents/doc-1");
    expect(response.status).toBe(200);
    expect(response.body.metadataComplete).toBe(true);
    expect(response.body.version).toBe(1);
  });

  it("returns 404 for an unknown id", async () => {
    const app = buildApp([]);
    const response = await request(app).get("/api/documents/unknown");
    expect(response.status).toBe(404);
  });
});
