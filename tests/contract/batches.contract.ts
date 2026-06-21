import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createBatchesRoutes } from "@/backend/routes/batches";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import type { ArchiveDocument } from "@/lib/types";

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

function buildApp(documents: ArchiveDocument[]): express.Express {
  const app = express();
  app.use(express.json());
  const store = createMemoryStore(documents);
  app.use(
    createBatchesRoutes({
      store,
      documentStorage: createFakeDocumentStorage(),
      documentProcessor: createFakeDocumentProcessor(),
      ingestionQueue: createFakeIngestionQueue()
    })
  );
  return app;
}

describe("POST /api/batches", () => {
  it("creates a batch and returns a batchId", async () => {
    const docs = fixtureDocuments(3);
    const app = buildApp(docs);
    const response = await request(app)
      .post("/api/batches")
      .send({ archiveDocumentIds: docs.map((d) => d.id) });
    expect(response.status).toBe(201);
    expect(typeof response.body.batchId).toBe("string");
  });

  it("returns BATCH_TOO_LARGE when more than 50 documents are submitted", async () => {
    const docs = fixtureDocuments(51);
    const app = buildApp(docs);
    const response = await request(app)
      .post("/api/batches")
      .send({ archiveDocumentIds: docs.map((d) => d.id) });
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("BATCH_TOO_LARGE");
    expect(response.body.max).toBe(50);
  });

  it("skips ids that don't match a known archive document", async () => {
    const docs = fixtureDocuments(1);
    const app = buildApp(docs);
    const response = await request(app)
      .post("/api/batches")
      .send({ archiveDocumentIds: [docs[0].id, "unknown-doc"] });
    const statusResponse = await request(app).get(`/api/batches/${response.body.batchId}`);
    expect(statusResponse.body.documents).toHaveLength(1);
  });
});

describe("GET /api/batches/:batchId", () => {
  it("returns per-document status within a batch", async () => {
    const docs = fixtureDocuments(2);
    const app = buildApp(docs);
    const createResponse = await request(app)
      .post("/api/batches")
      .send({ archiveDocumentIds: docs.map((d) => d.id) });
    const { batchId } = createResponse.body;
    const statusResponse = await request(app).get(`/api/batches/${batchId}`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.batchId).toBe(batchId);
    expect(statusResponse.body.documents).toHaveLength(2);
  });

  it("returns BATCH_NOT_FOUND for an unknown batchId", async () => {
    const app = buildApp([]);
    const response = await request(app).get("/api/batches/unknown-batch");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("BATCH_NOT_FOUND");
  });
});
