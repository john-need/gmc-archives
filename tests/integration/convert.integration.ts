import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import type { ArchiveDocument } from "@/lib/types";

describe("end-to-end conversion through the fakes", () => {
  it("produces an OkfRecord with author/location/entities intact", async () => {
    const document: ArchiveDocument = {
      id: "doc-42",
      title: "Trail Report 1972",
      section: "Field Reports",
      date: "1972-06-15",
      sourceFormat: "scanned-image",
      storageObjectPath: "doc-42/v1",
      version: 1,
      metadataComplete: true
    };
    const publishedJobs: Array<{ archiveDocumentId: string; version: number }> = [];

    const app = express();
    app.use(express.json());
    const store = createMemoryStore([document]);
    const documentStorage = createFakeDocumentStorage();
    await documentStorage.upload(new Blob(["scanned page bytes"]), { archiveDocumentId: document.id });
    app.use(
      createDocumentsRoutes({
        store,
        documentStorage,
        documentProcessor: createFakeDocumentProcessor({
          body: "Reported by ranger on the Long Trail near Camel's Hump.",
          author: "J. Ranger",
          location: "Camel's Hump",
          entities: ["Camel's Hump", "Long Trail"],
          confidence: 0.92
        }),
        ingestionQueue: createFakeIngestionQueue((job) => publishedJobs.push(job))
      })
    );

    const response = await request(app).post(`/api/documents/${document.id}/convert`);

    expect(response.status).toBe(200);
    expect(response.body.okfRecord).toMatchObject({
      archiveDocumentId: "doc-42",
      author: "J. Ranger",
      location: "Camel's Hump",
      entities: ["Camel's Hump", "Long Trail"]
    });
    expect(publishedJobs).toEqual([{ archiveDocumentId: "doc-42", version: 1 }]);
  });
});
