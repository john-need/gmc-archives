import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createDocumentUploadRoutes } from "@/backend/routes/documents";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeIngestionQueue } from "@/backend/ingestion/fakeIngestionQueue";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/conversion/validateUploadFile";
import type { User } from "@/lib/types";

function withUser(app: express.Express, user: User | null): void {
  app.use((req, _res, next) => {
    (req as express.Request & { user: User | null }).user = user;
    next();
  });
}

function buildApp(user: User | null = { id: "editor-1", role: "publisher", identityProvider: "google" }) {
  const app = express();
  app.use(express.json());
  withUser(app, user);
  const store = createMemoryStore();
  const documentStorage = createFakeDocumentStorage();
  const documentProcessor = createFakeDocumentProcessor({ body: "extracted text" });
  const ingestionQueue = createFakeIngestionQueue();
  const catalogStore = createFakeCatalogStore();
  const semanticIndex = createFakeSemanticIndex();
  app.use(
    createDocumentUploadRoutes({
      store,
      documentStorage,
      documentProcessor,
      ingestionQueue,
      catalogStore,
      semanticIndex
    })
  );
  return { app, store };
}

describe("POST /api/documents (upload)", () => {
  it("creates, converts, and publishes a PDF upload in one request", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("%PDF-1.4 fake content"), "report.pdf");
    expect(response.status).toBe(201);
    expect(typeof response.body.archiveDocumentId).toBe("string");
    expect(response.body.catalogEntry.status).toBe("current");
  });

  it("creates, converts, and publishes a .docx upload", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("fake docx bytes"), "notes.docx");
    expect(response.status).toBe(201);
  });

  it("creates, converts, and publishes a .csv upload", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("Name,Date\nA,1978"), "data.csv");
    expect(response.status).toBe(201);
  });

  it("returns 422 UNSUPPORTED_FORMAT for a disallowed extension", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("binary"), "program.exe");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("UNSUPPORTED_FORMAT");
  });

  it("returns 422 FILE_TOO_LARGE for a file over the 50MB cap", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.alloc(MAX_UPLOAD_SIZE_BYTES + 1), "big.pdf");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("FILE_TOO_LARGE");
  });

  it("returns 403 for a Researcher session (Publisher/Editor-only)", async () => {
    const { app } = buildApp({ id: "researcher-1", role: "viewer", identityProvider: "google" });
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("%PDF-1.4 fake content"), "report.pdf");
    expect(response.status).toBe(403);
  });

  it("returns 401 with no session", async () => {
    const { app } = buildApp(null);
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("%PDF-1.4 fake content"), "report.pdf");
    expect(response.status).toBe(401);
  });

  it("returns 422 UNSUPPORTED_FORMAT when no file is attached at all", async () => {
    const { app } = buildApp();
    const response = await request(app).post("/api/documents").field("title", "No file here");
    expect(response.status).toBe(422);
    expect(response.body.error).toBe("UNSUPPORTED_FORMAT");
  });

  it("returns 502 CONVERSION_FAILED when the storage/processor pipeline fails", async () => {
    const app = express();
    app.use(express.json());
    withUser(app, { id: "editor-1", role: "publisher", identityProvider: "google" });
    const store = createMemoryStore();
    const failingStorage = createFakeDocumentStorage();
    app.use(
      createDocumentUploadRoutes({
        store,
        documentStorage: failingStorage,
        documentProcessor: {
          async extract() {
            throw new Error("processor unavailable");
          }
        },
        ingestionQueue: createFakeIngestionQueue(),
        catalogStore: createFakeCatalogStore(),
        semanticIndex: createFakeSemanticIndex()
      })
    );
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("%PDF-1.4 fake content"), "report.pdf");
    expect(response.status).toBe(502);
    expect(response.body.error).toBe("CONVERSION_FAILED");
  });

  it("returns 502 CATALOG_UNAVAILABLE when publish fails after a successful conversion", async () => {
    const app = express();
    app.use(express.json());
    withUser(app, { id: "editor-1", role: "publisher", identityProvider: "google" });
    const store = createMemoryStore();
    const failingCatalogStore = {
      async getEntriesForDocument() {
        return [];
      },
      async getEntryById() {
        return null;
      },
      async save() {
        throw new Error("catalog unavailable");
      }
    };
    app.use(
      createDocumentUploadRoutes({
        store,
        documentStorage: createFakeDocumentStorage(),
        documentProcessor: createFakeDocumentProcessor({ body: "extracted text" }),
        ingestionQueue: createFakeIngestionQueue(),
        catalogStore: failingCatalogStore,
        semanticIndex: createFakeSemanticIndex()
      })
    );
    const response = await request(app)
      .post("/api/documents")
      .attach("file", Buffer.from("%PDF-1.4 fake content"), "report.pdf");
    expect(response.status).toBe(502);
    expect(response.body.error).toBe("CATALOG_UNAVAILABLE");
  });
});
