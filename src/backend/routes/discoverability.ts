import { Router } from "express";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { checkDiscoverability } from "@/lib/search/checkDiscoverability";

export interface DiscoverabilityRoutesDeps {
  store: MemoryStore;
  catalogStore: CatalogStore;
  semanticIndex: SemanticIndex;
}

export function createDiscoverabilityRoutes(deps: DiscoverabilityRoutesDeps): Router {
  const router = Router();

  router.get("/api/documents/:id/discoverability", async (req, res) => {
    const entries = await deps.catalogStore.getEntriesForDocument(req.params.id);
    const currentEntry = entries.find((entry) => entry.status === "current");
    if (currentEntry === undefined) {
      res.status(404).json({ error: "NOT_PUBLISHED" });
      return;
    }
    const status = await checkDiscoverability(currentEntry.embeddingId, deps.semanticIndex);
    res.status(200).json({ status });
  });

  return router;
}
