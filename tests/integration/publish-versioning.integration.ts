import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createPublishRoutes } from "@/backend/routes/publish";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { OkfRecord } from "@/lib/types";

function okfRecord(overrides: Partial<OkfRecord> = {}): OkfRecord {
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

describe("versioning/supersede on republish", () => {
  it("marks v1 superseded and v2 current after a corrected republish", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    store.okfRecords.set("okf-1", okfRecord());
    store.okfRecords.set("okf-2", okfRecord({ id: "okf-2", archiveDocumentVersion: 2, body: "corrected text" }));
    const catalogStore = createFakeCatalogStore();
    app.use(
      createPublishRoutes({
        store,
        catalogStore,
        semanticIndex: createFakeSemanticIndex()
      })
    );

    const v1Response = await request(app).post("/api/documents/doc-1/publish").send({ okfRecordId: "okf-1" });
    expect(v1Response.status).toBe(200);
    expect(v1Response.body.catalogEntry.status).toBe("current");
    expect(v1Response.body.catalogEntry.version).toBe(1);

    const v2Response = await request(app).post("/api/documents/doc-1/publish").send({ okfRecordId: "okf-2" });
    expect(v2Response.status).toBe(200);
    expect(v2Response.body.catalogEntry.status).toBe("current");
    expect(v2Response.body.catalogEntry.version).toBe(2);

    const entries = await catalogStore.getEntriesForDocument("doc-1");
    const v1 = entries.find((entry) => entry.version === 1);
    const v2 = entries.find((entry) => entry.version === 2);
    expect(v1?.status).toBe("superseded");
    expect(v2?.status).toBe("current");
  });
});
