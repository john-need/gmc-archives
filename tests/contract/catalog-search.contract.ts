import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createCatalogRoutes } from "@/backend/routes/catalog";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import type { CatalogEntry } from "@/lib/types";

function fixtureEntry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    catalogEntryId: "entry-1",
    version: 1,
    status: "current",
    okfRecordId: "okf-1",
    archiveDocumentId: "doc-1",
    publishedAt: new Date().toISOString(),
    agentSearchDiscoverable: "discoverable",
    embeddingId: "embedding-1",
    searchableFields: { title: "Trail Maintenance Report 1978", section: "Field Reports", date: "1978-03-01" },
    ...overrides
  };
}

describe("GET /api/catalog/search", () => {
  it("ranks results by semantic relevance to the query", async () => {
    const app = express();
    app.use(express.json());
    const catalogStore = createFakeCatalogStore();
    const semanticIndex = createFakeSemanticIndex();
    await catalogStore.save(fixtureEntry());
    await semanticIndex.index({ catalogEntryId: "entry-1", text: "trail maintenance reports from the 1970s" });

    app.use(
      createCatalogRoutes({
        store: createMemoryStore(),
        catalogStore,
        semanticIndex,
        documentStorage: createFakeDocumentStorage()
      })
    );

    const response = await request(app).get("/api/catalog/search").query({ q: "trail maintenance 1970s" });
    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].catalogEntryId).toBe("entry-1");
  });

  it("applies structured filters as post-filters on ranked results", async () => {
    const app = express();
    app.use(express.json());
    const catalogStore = createFakeCatalogStore();
    const semanticIndex = createFakeSemanticIndex();
    await catalogStore.save(fixtureEntry());
    await semanticIndex.index({ catalogEntryId: "entry-1", text: "trail maintenance reports" });

    app.use(
      createCatalogRoutes({
        store: createMemoryStore(),
        catalogStore,
        semanticIndex,
        documentStorage: createFakeDocumentStorage()
      })
    );

    const response = await request(app)
      .get("/api/catalog/search")
      .query({ q: "trail maintenance", section: "Newsletters" });
    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(0);
  });

  it("returns [] (not an error) when no matches", async () => {
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

    const response = await request(app).get("/api/catalog/search").query({ q: "nothing relevant" });
    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([]);
  });
});
