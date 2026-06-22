import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes } from "@/backend/routes/documents";
import { createPublishRoutes } from "@/backend/routes/publish";
import { createAskRoutes } from "@/backend/routes/ask";
import { createFavoritesRoutes } from "@/backend/routes/favorites";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import type { ArchiveDocument, OkfRecord, User } from "@/lib/types";

describe("superseded versions are excluded from Library, Favorites, and Ask & Search by default (FR-016)", () => {
  it("a republished document shows only its current version across all three surfaces", async () => {
    const document: ArchiveDocument = {
      id: "doc-1",
      title: "GMC Newsletter Spring 1978",
      section: "Newsletters",
      date: "1978-03-01",
      sourceFormat: "pdf",
      storageObjectPath: "doc-1/v1",
      version: 1,
      metadataComplete: true
    };
    const store = createMemoryStore([document]);
    const documentStorage = createFakeDocumentStorage();
    const documentProcessor = createFakeDocumentProcessor();
    const ingestionQueue = createFakeIngestionQueue();
    const catalogStore = createFakeCatalogStore();
    const semanticIndex = createFakeSemanticIndex();
    const favoritesStore = createFakeFavoritesStore();
    const user: User = { id: "user-1", role: "viewer", identityProvider: "google" };

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as express.Request & { user: User }).user = user;
      next();
    });
    app.use(createDocumentsRoutes({ store, documentStorage, documentProcessor, ingestionQueue }));
    app.use(createPublishRoutes({ store, catalogStore, semanticIndex }));
    app.use(createAskRoutes({ store, catalogStore, semanticIndex, generativeAnswerModel: createFakeGenerativeAnswerModel() }));
    app.use(createFavoritesRoutes({ store, favoritesStore }));

    const v1: OkfRecord = {
      id: "okf-1",
      archiveDocumentId: "doc-1",
      archiveDocumentVersion: 1,
      title: "GMC Newsletter Spring 1978",
      section: "Newsletters",
      date: "1978-03-01",
      sourceIdentifier: "doc-1",
      body: "Original text about trail maintenance.",
      author: null,
      location: null,
      entities: [],
      conversionWarnings: []
    };
    store.okfRecords.set(v1.id, v1);
    await request(app).post("/api/documents/doc-1/publish").send({ okfRecordId: "okf-1" });
    await semanticIndex.index({ catalogEntryId: "placeholder", text: v1.body });

    // Republish: bump the ArchiveDocument's version in place (FR-007a — same
    // id, incremented version) and publish the corrected OkfRecord as v2.
    document.version = 2;
    const v2: OkfRecord = { ...v1, id: "okf-2", archiveDocumentVersion: 2, body: "Corrected text about trail maintenance." };
    store.okfRecords.set(v2.id, v2);
    await request(app).post("/api/documents/doc-1/publish").send({ okfRecordId: "okf-2" });

    await request(app).post("/api/favorites/doc-1");

    const libraryResponse = await request(app).get("/api/documents");
    expect(libraryResponse.body.documents).toHaveLength(1);
    expect(libraryResponse.body.documents[0].version).toBe(2);

    const favoritesResponse = await request(app).get("/api/favorites");
    expect(favoritesResponse.body.documents).toHaveLength(1);
    expect(favoritesResponse.body.documents[0].version).toBe(2);

    const entries = await catalogStore.getEntriesForDocument("doc-1");
    expect(entries.find((entry) => entry.version === 1)?.status).toBe("superseded");
    expect(entries.find((entry) => entry.version === 2)?.status).toBe("current");

    const askResponse = await request(app).post("/api/ask").send({ question: "trail maintenance" });
    expect(askResponse.body.sources.every((source: { snippet: string }) => !source.snippet.includes("Original text"))).toBe(true);
  });
});
