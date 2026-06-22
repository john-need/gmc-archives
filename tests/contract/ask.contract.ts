import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createAskRoutes } from "@/backend/routes/ask";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import type { CatalogEntry, OkfRecord } from "@/lib/types";

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
    searchableFields: { title: "Trail Report", section: "Field Reports", date: "1978-03-01" },
    ...overrides
  };
}

function fixtureOkfRecord(overrides: Partial<OkfRecord> = {}): OkfRecord {
  return {
    id: "okf-1",
    archiveDocumentId: "doc-1",
    archiveDocumentVersion: 1,
    title: "Trail Report",
    section: "Field Reports",
    date: "1978-03-01",
    sourceIdentifier: "doc-1",
    body: "The Long Trail was completed in 1930.",
    author: null,
    location: null,
    entities: [],
    conversionWarnings: [],
    ...overrides
  };
}

describe("POST /api/ask", () => {
  it("returns an answer with sources when retrieval finds matches", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    store.okfRecords.set("okf-1", fixtureOkfRecord());
    const catalogStore = createFakeCatalogStore();
    await catalogStore.save(fixtureEntry());
    const semanticIndex = createFakeSemanticIndex();
    await semanticIndex.index({ catalogEntryId: "entry-1", text: "Long Trail completed 1930" });

    app.use(
      createAskRoutes({
        store,
        catalogStore,
        semanticIndex,
        generativeAnswerModel: createFakeGenerativeAnswerModel()
      })
    );

    const response = await request(app).post("/api/ask").send({ question: "Long Trail completed" });
    expect(response.status).toBe(200);
    expect(response.body.answer.length).toBeGreaterThan(0);
    expect(response.body.sources).toHaveLength(1);
    expect(response.body.sources[0].archiveDocumentId).toBe("doc-1");
  });

  it("returns a best-effort answer with empty sources when nothing matches", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createAskRoutes({
        store: createMemoryStore(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        generativeAnswerModel: createFakeGenerativeAnswerModel()
      })
    );

    const response = await request(app).post("/api/ask").send({ question: "nothing relevant" });
    expect(response.status).toBe(200);
    expect(response.body.sources).toEqual([]);
  });

  it("returns 502 ASK_FAILED when the generative model fails", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createAskRoutes({
        store: createMemoryStore(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        generativeAnswerModel: createFakeGenerativeAnswerModel({ throwError: true })
      })
    );

    const response = await request(app).post("/api/ask").send({ question: "anything" });
    expect(response.status).toBe(502);
    expect(response.body.error).toBe("ASK_FAILED");
  });

  it("treats a missing question as an empty string rather than throwing", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createAskRoutes({
        store: createMemoryStore(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        generativeAnswerModel: createFakeGenerativeAnswerModel()
      })
    );

    const response = await request(app).post("/api/ask").send({});
    expect(response.status).toBe(200);
  });
});
