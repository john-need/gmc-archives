import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createCatalogRoutes } from "@/backend/routes/catalog";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import type { ArchiveDocument } from "@/lib/types";

function fixtureDocument(overrides: Partial<ArchiveDocument> = {}): ArchiveDocument {
  return {
    id: "doc-1",
    title: "GMC Newsletter Spring 1978",
    section: "Newsletters",
    date: "1978-03-01",
    sourceFormat: "markdown",
    storageObjectPath: "doc-1/v1",
    version: 1,
    metadataComplete: true,
    ...overrides
  };
}

describe("GET /api/documents/:id/download", () => {
  it("preserves the original format", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([fixtureDocument()]);
    const documentStorage = createFakeDocumentStorage();
    await documentStorage.upload(new Blob(["# Original content"], { type: "text/markdown" }), {
      archiveDocumentId: "doc-1"
    });
    app.use(
      createCatalogRoutes({
        store,
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        documentStorage
      })
    );

    const response = await request(app).get("/api/documents/doc-1/download");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/markdown/);
    expect(response.text).toBe("# Original content");
  });

  it("returns SOURCE_UNAVAILABLE when nothing was ever uploaded", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([fixtureDocument({ id: "doc-2" })]);
    app.use(
      createCatalogRoutes({
        store,
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        documentStorage: createFakeDocumentStorage()
      })
    );

    const response = await request(app).get("/api/documents/doc-2/download");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("SOURCE_UNAVAILABLE");
  });

  it("returns SOURCE_UNAVAILABLE for a document id that isn't in the store at all", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createCatalogRoutes({
        store: createMemoryStore(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        documentStorage: createFakeDocumentStorage()
      })
    );
    const response = await request(app).get("/api/documents/unknown/download");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("SOURCE_UNAVAILABLE");
  });
});
