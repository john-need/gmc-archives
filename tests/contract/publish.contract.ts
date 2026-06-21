import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createPublishRoutes } from "@/backend/routes/publish";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { OkfRecord } from "@/lib/types";

function fixtureOkfRecord(overrides: Partial<OkfRecord> = {}): OkfRecord {
  return {
    id: "okf-1",
    archiveDocumentId: "doc-1",
    archiveDocumentVersion: 1,
    title: "GMC Newsletter Spring 1978",
    section: "Newsletters",
    date: "1978-03-01",
    sourceIdentifier: "doc-1",
    body: "extracted text",
    author: null,
    location: null,
    entities: [],
    conversionWarnings: [],
    ...overrides
  };
}

function buildApp(okfRecords: OkfRecord[], catalogStore: CatalogStore = createFakeCatalogStore()) {
  const app = express();
  app.use(express.json());
  const store = createMemoryStore();
  for (const record of okfRecords) {
    store.okfRecords.set(record.id, record);
  }
  app.use(
    createPublishRoutes({
      store,
      catalogStore,
      semanticIndex: createFakeSemanticIndex()
    })
  );
  return app;
}

describe("POST /api/documents/:id/publish", () => {
  it("returns the new CatalogEntry on success", async () => {
    const app = buildApp([fixtureOkfRecord()]);
    const response = await request(app).post("/api/documents/doc-1/publish");
    expect(response.status).toBe(200);
    expect(response.body.catalogEntry.archiveDocumentId).toBe("doc-1");
    expect(response.body.catalogEntry.status).toBe("current");
  });

  it("returns ALREADY_PUBLISHED for the same (archiveDocumentId, version)", async () => {
    const catalogStore = createFakeCatalogStore();
    const app = buildApp([fixtureOkfRecord()], catalogStore);
    await request(app).post("/api/documents/doc-1/publish");
    const response = await request(app).post("/api/documents/doc-1/publish");
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("ALREADY_PUBLISHED");
    expect(typeof response.body.catalogEntryId).toBe("string");
  });

  it("returns CATALOG_UNAVAILABLE when the catalog store fails", async () => {
    const failingCatalogStore: CatalogStore = {
      async getEntriesForDocument() {
        return [];
      },
      async getEntryById() {
        return null;
      },
      async save() {
        throw new Error("unreachable");
      }
    };
    const app = buildApp([fixtureOkfRecord()], failingCatalogStore);
    const response = await request(app).post("/api/documents/doc-1/publish");
    expect(response.status).toBe(502);
    expect(response.body.error).toBe("CATALOG_UNAVAILABLE");
  });

  it("returns OKF_RECORD_NOT_FOUND when no OkfRecord exists for the document", async () => {
    const app = buildApp([]);
    const response = await request(app).post("/api/documents/doc-1/publish");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("OKF_RECORD_NOT_FOUND");
  });
});
