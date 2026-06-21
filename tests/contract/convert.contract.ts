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

describe("POST /api/documents/:id/convert", () => {
  it("returns the OkfRecord on success", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([fixtureDocument()]);
    const documentStorage = createFakeDocumentStorage();
    await documentStorage.upload(new Blob(["source bytes"]), { archiveDocumentId: "doc-1" });
    app.use(
      createDocumentsRoutes({
        store,
        documentStorage,
        documentProcessor: createFakeDocumentProcessor({ body: "extracted text" }),
        ingestionQueue: createFakeIngestionQueue()
      })
    );
    const response = await request(app).post("/api/documents/doc-1/convert");
    expect(response.status).toBe(200);
    expect(response.body.okfRecord.body).toBe("extracted text");
    expect(response.body.okfRecord.archiveDocumentId).toBe("doc-1");
  });

  it("returns INCOMPLETE_METADATA when the document is missing required fields", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([fixtureDocument({ metadataComplete: false, title: "" })]);
    app.use(
      createDocumentsRoutes({
        store,
        documentStorage: createFakeDocumentStorage(),
        documentProcessor: createFakeDocumentProcessor(),
        ingestionQueue: createFakeIngestionQueue()
      })
    );
    const response = await request(app).post("/api/documents/doc-1/convert");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("INCOMPLETE_METADATA");
    expect(response.body.missingFields).toContain("title");
  });

  it("returns UNSUPPORTED_FORMAT for an unsupported sourceFormat", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([
      // @ts-expect-error testing a value outside the SourceFormat union
      fixtureDocument({ sourceFormat: "audio" })
    ]);
    app.use(
      createDocumentsRoutes({
        store,
        documentStorage: createFakeDocumentStorage(),
        documentProcessor: createFakeDocumentProcessor(),
        ingestionQueue: createFakeIngestionQueue()
      })
    );
    const response = await request(app).post("/api/documents/doc-1/convert");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("UNSUPPORTED_FORMAT");
  });
});
