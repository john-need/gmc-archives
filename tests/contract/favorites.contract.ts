import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import { createFavoritesRoutes } from "@/backend/routes/favorites";
import type { ArchiveDocument, User } from "@/lib/types";

function fixtureDocument(overrides: Partial<ArchiveDocument> = {}): ArchiveDocument {
  return {
    id: "doc-1",
    title: "GMC Newsletter Spring 1978",
    section: "Newsletters",
    date: "1978-03-01",
    sourceFormat: "pdf",
    storageObjectPath: "doc-1/v1",
    version: 1,
    metadataComplete: true,
    ...overrides
  };
}

function buildApp(user: User) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { user: User }).user = user;
    next();
  });
  const store = createMemoryStore([fixtureDocument()]);
  const favoritesStore = createFakeFavoritesStore();
  app.use(createFavoritesRoutes({ store, favoritesStore }));
  return { app, favoritesStore };
}

const user: User = { id: "user-1", role: "viewer", identityProvider: "google" };

describe("Favorites routes", () => {
  it("POST /api/favorites/:id favorites a document", async () => {
    const { app } = buildApp(user);
    const response = await request(app).post("/api/favorites/doc-1");
    expect(response.status).toBe(200);
    expect(response.body.favorited).toBe(true);
  });

  it("POST /api/favorites/:id is idempotent", async () => {
    const { app } = buildApp(user);
    await request(app).post("/api/favorites/doc-1");
    const response = await request(app).post("/api/favorites/doc-1");
    expect(response.status).toBe(200);
  });

  it("POST /api/favorites/:id returns 404 for an unknown document", async () => {
    const { app } = buildApp(user);
    const response = await request(app).post("/api/favorites/unknown");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("DOCUMENT_NOT_FOUND");
  });

  it("DELETE /api/favorites/:id unfavorites a document and is idempotent", async () => {
    const { app } = buildApp(user);
    await request(app).post("/api/favorites/doc-1");
    const response = await request(app).delete("/api/favorites/doc-1");
    expect(response.status).toBe(200);
    expect(response.body.favorited).toBe(false);
    const second = await request(app).delete("/api/favorites/doc-1");
    expect(second.status).toBe(200);
  });

  it("GET /api/favorites lists the current user's favorited documents", async () => {
    const { app } = buildApp(user);
    await request(app).post("/api/favorites/doc-1");
    const response = await request(app).get("/api/favorites");
    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].id).toBe("doc-1");
  });

  it("GET /api/favorites omits a favorited id whose document no longer exists in the store", async () => {
    const store = createMemoryStore([fixtureDocument()]);
    const favoritesStore = createFakeFavoritesStore();
    await favoritesStore.add("user-1", "doc-1");
    await favoritesStore.add("user-1", "deleted-doc");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as express.Request & { user: User }).user = user;
      next();
    });
    app.use(createFavoritesRoutes({ store, favoritesStore }));
    const response = await request(app).get("/api/favorites");
    expect(response.body.documents).toHaveLength(1);
  });

  it("works without a req.user set at all (scoped to an empty userId)", async () => {
    const store = createMemoryStore([fixtureDocument()]);
    const favoritesStore = createFakeFavoritesStore();
    const app = express();
    app.use(express.json());
    app.use(createFavoritesRoutes({ store, favoritesStore }));
    const getResponse = await request(app).get("/api/favorites");
    expect(getResponse.status).toBe(200);
    const deleteResponse = await request(app).delete("/api/favorites/doc-1");
    expect(deleteResponse.status).toBe(200);
  });
});
