import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createAskRoutes } from "@/backend/routes/ask";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import type { CatalogEntry, OkfRecord } from "@/lib/types";

describe("end-to-end ask through the fakes", () => {
  it("retrieves, generates an answer with citations, and logs the exchange", async () => {
    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const entry: CatalogEntry = {
      catalogEntryId: "entry-1",
      version: 1,
      status: "current",
      okfRecordId: "okf-1",
      archiveDocumentId: "doc-42",
      publishedAt: new Date().toISOString(),
      agentSearchDiscoverable: "discoverable",
      embeddingId: "embedding-1",
      searchableFields: { title: "Trail Report", section: "Field Reports", date: "1978-03-01" }
    };
    const okfRecord: OkfRecord = {
      id: "okf-1",
      archiveDocumentId: "doc-42",
      archiveDocumentVersion: 1,
      title: "Trail Report",
      section: "Field Reports",
      date: "1978-03-01",
      sourceIdentifier: "doc-42",
      body: "The Long Trail was completed in 1930 by the Green Mountain Club.",
      author: null,
      location: null,
      entities: [],
      conversionWarnings: []
    };

    const store = createMemoryStore();
    store.okfRecords.set(okfRecord.id, okfRecord);
    const catalogStore = createFakeCatalogStore();
    await catalogStore.save(entry);
    const semanticIndex = createFakeSemanticIndex();
    await semanticIndex.index({ catalogEntryId: "entry-1", text: okfRecord.body });

    const app = express();
    app.use(express.json());
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
    expect(response.body.sources[0].archiveDocumentId).toBe("doc-42");

    const logLines = stdoutSpy.mock.calls.map((call) => String(call[0]));
    const qaLogLine = logLines.find((line) => line.includes("\"question\""));
    expect(qaLogLine).toBeDefined();
    expect(qaLogLine).toContain("doc-42");

    stdoutSpy.mockRestore();
  });
});
