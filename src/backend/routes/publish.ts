import { Router } from "express";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { publishRecord } from "@/backend/ingestion/publishHandler";
import { attemptConversion, type ConversionHandlerDeps } from "@/backend/ingestion/conversionHandler";
import type { OkfRecord, PipelineStatus } from "@/lib/types";

export interface PublishRoutesDeps {
  store: MemoryStore;
  catalogStore: CatalogStore;
  semanticIndex: SemanticIndex;
  conversionDeps?: ConversionHandlerDeps;
}

function latestOkfRecordForDocument(store: MemoryStore, archiveDocumentId: string): OkfRecord | undefined {
  const records = Array.from(store.okfRecords.values()).filter((record) => record.archiveDocumentId === archiveDocumentId);
  return records.sort((a, b) => b.archiveDocumentVersion - a.archiveDocumentVersion)[0];
}

export async function attemptPublish(
  okfRecord: OkfRecord,
  deps: PublishRoutesDeps
): Promise<{ httpStatus: 200 | 409 | 502; body: Record<string, unknown> }> {
  const previous = deps.store.pipelineStatuses.get(okfRecord.archiveDocumentId);
  const attempts = previous?.attempts ?? [];

  try {
    const result = await publishRecord(okfRecord, { catalogStore: deps.catalogStore, semanticIndex: deps.semanticIndex });

    if (result.outcome === "error") {
      return { httpStatus: 409, body: { error: result.error, catalogEntryId: result.catalogEntryId } };
    }

    deps.store.pipelineStatuses.set(okfRecord.archiveDocumentId, {
      archiveDocumentId: okfRecord.archiveDocumentId,
      archiveDocumentVersion: okfRecord.archiveDocumentVersion,
      batchId: previous?.batchId ?? null,
      stage: "published",
      lastError: null,
      attempts: [...attempts, { attemptedAt: new Date().toISOString(), action: "publish", outcome: "success", errorDetail: null }]
    });
    return { httpStatus: 200, body: { catalogEntry: result.catalogEntry } };
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : String(error);
    deps.store.pipelineStatuses.set(okfRecord.archiveDocumentId, {
      archiveDocumentId: okfRecord.archiveDocumentId,
      archiveDocumentVersion: okfRecord.archiveDocumentVersion,
      batchId: previous?.batchId ?? null,
      stage: "failed",
      lastError: errorDetail,
      attempts: [...attempts, { attemptedAt: new Date().toISOString(), action: "publish", outcome: "failure", errorDetail }]
    });
    return { httpStatus: 502, body: { error: "CATALOG_UNAVAILABLE" } };
  }
}

export function createPublishRoutes(deps: PublishRoutesDeps): Router {
  const router = Router();

  router.post("/api/documents/:id/publish", async (req, res) => {
    const archiveDocumentId = req.params.id;
    const okfRecordId: string | undefined = req.body?.okfRecordId;
    const okfRecord = okfRecordId
      ? deps.store.okfRecords.get(okfRecordId)
      : latestOkfRecordForDocument(deps.store, archiveDocumentId);

    if (okfRecord === undefined) {
      res.status(404).json({ error: "OKF_RECORD_NOT_FOUND" });
      return;
    }

    const outcome = await attemptPublish(okfRecord, deps);
    res.status(outcome.httpStatus).json(outcome.body);
  });

  router.post("/api/documents/:id/retry", async (req, res) => {
    const archiveDocumentId = req.params.id;
    const status = deps.store.pipelineStatuses.get(archiveDocumentId);
    const lastAttempt = status?.attempts[status.attempts.length - 1];

    if (status === undefined || lastAttempt === undefined) {
      res.status(404).json({ error: "NOTHING_TO_RETRY" });
      return;
    }

    if (lastAttempt.action === "publish") {
      const okfRecord = latestOkfRecordForDocument(deps.store, archiveDocumentId);
      if (okfRecord === undefined) {
        res.status(404).json({ error: "OKF_RECORD_NOT_FOUND" });
        return;
      }
      await attemptPublish(okfRecord, deps);
    } else if (deps.conversionDeps !== undefined) {
      const document = deps.store.archiveDocuments.get(archiveDocumentId);
      if (document === undefined) {
        res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
        return;
      }
      await attemptConversion(document, deps.conversionDeps, deps.store);
    }

    const pipelineStatus: PipelineStatus | undefined = deps.store.pipelineStatuses.get(archiveDocumentId);
    res.status(200).json({ pipelineStatus });
  });

  return router;
}
