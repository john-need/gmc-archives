import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createCatalogRoutes } from "@/backend/routes/catalog";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import type { ArchiveDocument } from "@/lib/types";

describe("downloading a document returns its original format/content-type from any surface (FR-015)", () => {
  it("the same download endpoint backs the Library, document viewer, and Sources panel alike", async () => {
    const document: ArchiveDocument = {
      id: "doc-1",
      title: "Field Notes",
      section: "Field Reports",
      date: "1978-03-01",
      sourceFormat: "markdown",
      storageObjectPath: "doc-1/v1",
      version: 1,
      metadataComplete: true
    };
    const store = createMemoryStore([document]);
    const documentStorage = createFakeDocumentStorage();
    await documentStorage.upload(new Blob(["# Field notes content"], { type: "text/markdown" }), {
      archiveDocumentId: "doc-1"
    });

    const app = express();
    app.use(express.json());
    app.use(
      createCatalogRoutes({
        store,
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        documentStorage
      })
    );

    // Library, document viewer, and Sources panel all call the same
    // GET /api/documents/:id/download endpoint with no surface-specific
    // parameters — so issuing the same request three times models all
    // three call sites and proves none of them gets a different result.
    const fromLibrary = await request(app).get("/api/documents/doc-1/download");
    const fromViewer = await request(app).get("/api/documents/doc-1/download");
    const fromSourcesPanel = await request(app).get("/api/documents/doc-1/download");

    for (const response of [fromLibrary, fromViewer, fromSourcesPanel]) {
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/text\/markdown/);
      expect(response.text).toBe("# Field notes content");
    }
  });
});
