import { Router } from "express";
import type { MemoryStore } from "@/backend/store/memoryStore";

export interface HistoryRoutesDeps {
  store: MemoryStore;
}

export function createHistoryRoutes(deps: HistoryRoutesDeps): Router {
  const router = Router();

  router.get("/api/history", (req, res) => {
    const { archiveDocumentId, batchId } = req.query;
    const statuses = Array.from(deps.store.pipelineStatuses.values()).filter((status) => {
      if (typeof archiveDocumentId === "string" && status.archiveDocumentId !== archiveDocumentId) {
        return false;
      }
      if (typeof batchId === "string" && status.batchId !== batchId) {
        return false;
      }
      return true;
    });
    const attempts = statuses.flatMap((status) => status.attempts);
    res.status(200).json({ attempts });
  });

  return router;
}
