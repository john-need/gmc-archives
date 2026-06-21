import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";
import type { IngestionQueue } from "@/backend/ingestion/ingestionQueue";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { validateBatchSize } from "@/lib/catalog/validateBatchSize";
import type { PipelineStatus } from "@/lib/types";

export interface BatchesRoutesDeps {
  store: MemoryStore;
  documentStorage: DocumentStorage;
  documentProcessor: DocumentProcessor;
  ingestionQueue: IngestionQueue;
}

export function createBatchesRoutes(deps: BatchesRoutesDeps): Router {
  const router = Router();

  router.post("/api/batches", (req, res) => {
    const archiveDocumentIds: string[] = req.body?.archiveDocumentIds ?? [];
    const validation = validateBatchSize(archiveDocumentIds);
    if (!validation.valid) {
      res.status(422).json({ error: validation.error, max: validation.max });
      return;
    }

    const batchId = randomUUID();
    deps.store.batches.set(batchId, {
      batchId,
      archiveDocumentIds,
      createdBy: "unknown",
      createdAt: new Date().toISOString()
    });

    for (const archiveDocumentId of archiveDocumentIds) {
      const archiveDocument = deps.store.archiveDocuments.get(archiveDocumentId);
      if (archiveDocument === undefined) {
        continue;
      }
      const status: PipelineStatus = {
        archiveDocumentId,
        archiveDocumentVersion: archiveDocument.version,
        batchId,
        stage: "imported",
        lastError: null,
        attempts: []
      };
      deps.store.pipelineStatuses.set(archiveDocumentId, status);
    }

    res.status(201).json({ batchId });
  });

  router.get("/api/batches/:batchId", (req, res) => {
    const { batchId } = req.params;
    const batch = deps.store.batches.get(batchId);
    if (batch === undefined) {
      res.status(404).json({ error: "BATCH_NOT_FOUND" });
      return;
    }
    const documents = batch.archiveDocumentIds
      .map((id) => deps.store.pipelineStatuses.get(id))
      .filter((status): status is PipelineStatus => status !== undefined);
    res.status(200).json({ batchId, documents });
  });

  return router;
}
