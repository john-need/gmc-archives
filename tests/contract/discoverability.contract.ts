import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDiscoverabilityRoutes } from "@/backend/routes/discoverability";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { CatalogEntry } from "@/lib/types";

function fixtureEntry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    catalogEntryId: "entry-1",
    version: 1,
    status: "current",
    okfRecordId: "okf-1",
    archiveDocumentId: "doc-1",
    publishedAt: new Date().toISOString(),
    agentSearchDiscoverable: "pending",
    embeddingId: "embedding-1",
    searchableFields: { title: "Trail Report", section: "Field Reports", date: "1978-03-01" },
    ...overrides
  };
}

describe("GET /api/documents/:id/discoverability", () => {
  it("reports pending then discoverable as the embedding becomes queryable", async () => {
    const app = express();
    app.use(express.json());
    const catalogStore = createFakeCatalogStore();
    const semanticIndex = createFakeSemanticIndex({ queryableAfterMs: 200 });
    await catalogStore.save(fixtureEntry());
    await semanticIndex.index({ catalogEntryId: "entry-1", text: "trail report" });

    app.use(createDiscoverabilityRoutes({ store: createMemoryStore(), catalogStore, semanticIndex }));

    const firstCheck = await request(app).get("/api/documents/doc-1/discoverability");
    expect(firstCheck.status).toBe(200);
    expect(firstCheck.body.status).toBe("pending");

    await new Promise((resolve) => setTimeout(resolve, 250));

    const secondCheck = await request(app).get("/api/documents/doc-1/discoverability");
    expect(secondCheck.body.status).toBe("discoverable");
  });

  it("returns NOT_PUBLISHED for a document with no current CatalogEntry", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createDiscoverabilityRoutes({
        store: createMemoryStore(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex()
      })
    );
    const response = await request(app).get("/api/documents/unpublished-doc/discoverability");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("NOT_PUBLISHED");
  });
});
