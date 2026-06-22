import request from "supertest";
import { createApp } from "@/backend/app";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";

async function buildTestApp(role: "viewer" | "publisher") {
  const store = createMemoryStore();
  const documentStorage = createFakeDocumentStorage();
  const documentProcessor = createFakeDocumentProcessor();
  const ingestionQueue = createFakeIngestionQueue();
  const catalogStore = createFakeCatalogStore();
  const semanticIndex = createFakeSemanticIndex();
  const authProvider = createFakeAuthProvider({ role });
  const session = await authProvider.signIn();

  const app = createApp({
    store,
    authProvider,
    documentsDeps: { store, documentStorage, documentProcessor, ingestionQueue },
    publishDeps: { store, catalogStore, semanticIndex, conversionDeps: { documentStorage, documentProcessor, ingestionQueue } },
    catalogDeps: { store, catalogStore, semanticIndex, documentStorage },
    discoverabilityDeps: { store, catalogStore, semanticIndex },
    askDeps: { store, catalogStore, semanticIndex, generativeAnswerModel: createFakeGenerativeAnswerModel() },
    favoritesDeps: { store, favoritesStore: createFakeFavoritesStore() },
    uploadDeps: { store, documentStorage, documentProcessor, ingestionQueue, catalogStore, semanticIndex },
    accessRequestsDeps: { accessRequestStore: createFakeAccessRequestStore(), userDirectory: createFakeUserDirectory() },
    allowedOrigin: "https://gmc-archives.example.com"
  });
  return { app, token: session.token };
}

describe("createApp wiring", () => {
  it("sets the Access-Control-Allow-Origin header to the configured origin only", async () => {
    const { app, token } = await buildTestApp("viewer");
    const response = await request(app).get("/api/documents").set("Authorization", `Bearer ${token}`);
    expect(response.headers["access-control-allow-origin"]).toBe("https://gmc-archives.example.com");
  });

  it("blocks a Viewer from creating a batch via the fully wired app", async () => {
    const { app, token } = await buildTestApp("viewer");
    const response = await request(app)
      .post("/api/batches")
      .set("Authorization", `Bearer ${token}`)
      .send({ archiveDocumentIds: [] });
    expect(response.status).toBe(403);
  });

  it("allows a Publisher to create a batch via the fully wired app", async () => {
    const { app, token } = await buildTestApp("publisher");
    const response = await request(app)
      .post("/api/batches")
      .set("Authorization", `Bearer ${token}`)
      .send({ archiveDocumentIds: [] });
    expect(response.status).toBe(201);
  });

  it("answers CORS preflight requests directly", async () => {
    const { app } = await buildTestApp("viewer");
    const response = await request(app).options("/api/documents");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("GET");
  });

  it("returns 404 for an unrecognized document id via the session-authenticated app", async () => {
    const { app, token } = await buildTestApp("viewer");
    const response = await request(app).get("/api/documents/unknown").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(404);
  });
});
