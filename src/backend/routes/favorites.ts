import { Router } from "express";
import type { FavoritesStore } from "@/lib/favorites/favoritesStore";
import type { MemoryStore } from "@/backend/store/memoryStore";
import type { User } from "@/lib/types";

export interface FavoritesRoutesDeps {
  store: MemoryStore;
  favoritesStore: FavoritesStore;
}

type RequestWithUser = { user?: User | null };

export function createFavoritesRoutes(deps: FavoritesRoutesDeps): Router {
  const router = Router();

  router.get("/api/favorites", async (req, res) => {
    const userId = (req as unknown as RequestWithUser).user?.id ?? "";
    const favoritedIds = await deps.favoritesStore.list(userId);
    const documents = favoritedIds
      .map((id) => deps.store.archiveDocuments.get(id))
      .filter((doc): doc is NonNullable<typeof doc> => doc !== undefined);
    res.status(200).json({ documents });
  });

  router.post("/api/favorites/:archiveDocumentId", async (req, res) => {
    const userId = (req as unknown as RequestWithUser).user?.id ?? "";
    const { archiveDocumentId } = req.params;
    if (!deps.store.archiveDocuments.has(archiveDocumentId)) {
      res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      return;
    }
    await deps.favoritesStore.add(userId, archiveDocumentId);
    res.status(200).json({ favorited: true });
  });

  router.delete("/api/favorites/:archiveDocumentId", async (req, res) => {
    const userId = (req as unknown as RequestWithUser).user?.id ?? "";
    await deps.favoritesStore.remove(userId, req.params.archiveDocumentId);
    res.status(200).json({ favorited: false });
  });

  return router;
}
