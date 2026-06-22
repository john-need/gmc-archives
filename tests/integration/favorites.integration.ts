import express from "express";
import request from "supertest";
import { createMemoryStore } from "@/backend/store/memoryStore";
import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";
import { createFavoritesRoutes } from "@/backend/routes/favorites";
import type { ArchiveDocument, User } from "@/lib/types";

describe("favorite from Library, appears in Favorites, unfavorite removes it", () => {
  it("supports the full save and revisit flow", async () => {
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
    const user: User = { id: "user-1", role: "viewer", identityProvider: "google" };
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as express.Request & { user: User }).user = user;
      next();
    });
    const store = createMemoryStore([document]);
    app.use(createFavoritesRoutes({ store, favoritesStore: createFakeFavoritesStore() }));

    const beforeResponse = await request(app).get("/api/favorites");
    expect(beforeResponse.body.documents).toHaveLength(0);

    await request(app).post("/api/favorites/doc-1");
    const afterFavorite = await request(app).get("/api/favorites");
    expect(afterFavorite.body.documents).toHaveLength(1);
    expect(afterFavorite.body.documents[0].id).toBe("doc-1");

    await request(app).delete("/api/favorites/doc-1");
    const afterUnfavorite = await request(app).get("/api/favorites");
    expect(afterUnfavorite.body.documents).toHaveLength(0);
  });
});
