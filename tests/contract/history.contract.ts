import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createHistoryRoutes } from "@/backend/routes/history";

describe("GET /api/history", () => {
  it("returns the audit history of conversion/publish attempts, filterable by archiveDocumentId and batchId", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    store.pipelineStatuses.set("doc-1", {
      archiveDocumentId: "doc-1",
      archiveDocumentVersion: 1,
      batchId: "batch-1",
      stage: "published",
      lastError: null,
      attempts: [
        { attemptedAt: "2026-01-01T00:00:00Z", action: "convert", outcome: "success", errorDetail: null },
        { attemptedAt: "2026-01-01T00:01:00Z", action: "publish", outcome: "success", errorDetail: null }
      ]
    });
    store.pipelineStatuses.set("doc-2", {
      archiveDocumentId: "doc-2",
      archiveDocumentVersion: 1,
      batchId: "batch-2",
      stage: "failed",
      lastError: "boom",
      attempts: [{ attemptedAt: "2026-01-02T00:00:00Z", action: "convert", outcome: "failure", errorDetail: "boom" }]
    });

    app.use(createHistoryRoutes({ store }));

    const all = await request(app).get("/api/history");
    expect(all.body.attempts).toHaveLength(3);

    const byDocument = await request(app).get("/api/history").query({ archiveDocumentId: "doc-1" });
    expect(byDocument.body.attempts).toHaveLength(2);

    const byBatch = await request(app).get("/api/history").query({ batchId: "batch-2" });
    expect(byBatch.body.attempts).toHaveLength(1);
    expect(byBatch.body.attempts[0].errorDetail).toBe("boom");
  });
});
