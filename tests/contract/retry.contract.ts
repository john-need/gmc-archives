import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createPublishRoutes } from "@/backend/routes/publish";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import type { ArchiveDocument } from "@/lib/types";

describe("POST /api/documents/:id/retry", () => {
  it("retries the last failed convert action and returns the updated PipelineStatus", async () => {
    const document: ArchiveDocument = {
      id: "doc-9",
      title: "Trail Report",
      section: "Field Reports",
      date: "1972-06-15",
      sourceFormat: "pdf",
      storageObjectPath: "doc-9/v1",
      version: 1,
      metadataComplete: true
    };
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([document]);
    const documentStorage = createFakeDocumentStorage();
    const documentProcessor = createFakeDocumentProcessor();
    const ingestionQueue = createFakeIngestionQueue();

    app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor, ingestionQueue }));
    app.use(
      createPublishRoutes({
        store,
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        conversionDeps: { documentStorage, documentProcessor, ingestionQueue }
      })
    );

    const failedAttempt = await request(app).post("/api/documents/doc-9/convert");
    expect(failedAttempt.status).toBe(502);
    expect(failedAttempt.body.error).toBe("CONVERSION_FAILED");
    expect(store.pipelineStatuses.get("doc-9")?.stage).toBe("failed");

    await documentStorage.upload(new Blob(["source bytes"]), { archiveDocumentId: "doc-9" });
    const retryResponse = await request(app).post("/api/documents/doc-9/retry");

    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body.pipelineStatus.stage).toBe("converted");
    expect(retryResponse.body.pipelineStatus.attempts.length).toBeGreaterThanOrEqual(2);
  });

  it("returns NOTHING_TO_RETRY when there is no prior attempt", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    app.use(
      createPublishRoutes({ store, catalogStore: createFakeCatalogStore(), semanticIndex: createFakeSemanticIndex() })
    );
    const response = await request(app).post("/api/documents/doc-unknown/retry");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("NOTHING_TO_RETRY");
  });

  it("retries a failed publish action", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    store.okfRecords.set("okf-1", {
      id: "okf-1",
      archiveDocumentId: "doc-5",
      archiveDocumentVersion: 1,
      title: "Doc",
      section: "Newsletters",
      date: "1978-03-01",
      sourceIdentifier: "doc-5",
      body: "text",
      author: null,
      location: null,
      entities: [],
      conversionWarnings: []
    });
    app.use(
      createPublishRoutes({ store, catalogStore: createFakeCatalogStore(), semanticIndex: createFakeSemanticIndex() })
    );

    await request(app).post("/api/documents/doc-5/publish");
    const retryResponse = await request(app).post("/api/documents/doc-5/retry");
    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body.pipelineStatus.stage).toBe("published");
  });

  it("returns OKF_RECORD_NOT_FOUND when retrying a publish whose OkfRecord was removed", async () => {
    const app = express();
    app.use(express.json());
    const store = createMemoryStore();
    store.okfRecords.set("okf-2", {
      id: "okf-2",
      archiveDocumentId: "doc-6",
      archiveDocumentVersion: 1,
      title: "Doc",
      section: "Newsletters",
      date: "1978-03-01",
      sourceIdentifier: "doc-6",
      body: "text",
      author: null,
      location: null,
      entities: [],
      conversionWarnings: []
    });
    const failingCatalogStore = {
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
    app.use(createPublishRoutes({ store, catalogStore: failingCatalogStore, semanticIndex: createFakeSemanticIndex() }));

    await request(app).post("/api/documents/doc-6/publish");
    store.okfRecords.delete("okf-2");
    const retryResponse = await request(app).post("/api/documents/doc-6/retry");
    expect(retryResponse.status).toBe(404);
    expect(retryResponse.body.error).toBe("OKF_RECORD_NOT_FOUND");
  });

  it("returns DOCUMENT_NOT_FOUND when retrying a convert for a document no longer in the store", async () => {
    const document: ArchiveDocument = {
      id: "doc-gone",
      title: "Doc",
      section: "Newsletters",
      date: "1978-03-01",
      sourceFormat: "pdf",
      storageObjectPath: "doc-gone/v1",
      version: 1,
      metadataComplete: true
    };
    const app = express();
    app.use(express.json());
    const store = createMemoryStore([document]);
    const documentStorage = createFakeDocumentStorage();
    const documentProcessor = createFakeDocumentProcessor();
    const ingestionQueue = createFakeIngestionQueue();
    app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor, ingestionQueue }));
    app.use(
      createPublishRoutes({
        store,
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex(),
        conversionDeps: { documentStorage, documentProcessor, ingestionQueue }
      })
    );

    await request(app).post("/api/documents/doc-gone/convert");
    store.archiveDocuments.delete("doc-gone");
    const retryResponse = await request(app).post("/api/documents/doc-gone/retry");
    expect(retryResponse.status).toBe(404);
    expect(retryResponse.body.error).toBe("DOCUMENT_NOT_FOUND");
  });
});
