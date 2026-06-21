import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";
import type { IngestionQueue } from "@/backend/ingestion/ingestionQueue";
import { validateMetadata } from "@/lib/conversion/validateMetadata";
import { isSupportedFormat } from "@/lib/conversion/isSupportedFormat";
import { mapExtractionToOkfRecord } from "@/lib/conversion/mapExtractionToOkfRecord";
import type { MemoryStore } from "@/backend/store/memoryStore";
import type { ArchiveDocument, OkfRecord } from "@/lib/types";

export interface ConversionHandlerDeps {
  documentStorage: DocumentStorage;
  documentProcessor: DocumentProcessor;
  ingestionQueue: IngestionQueue;
}

export type ConversionResult =
  | { outcome: "success"; okfRecord: OkfRecord }
  | { outcome: "error"; error: "INCOMPLETE_METADATA"; missingFields: string[] }
  | { outcome: "error"; error: "UNSUPPORTED_FORMAT" };

export async function convertDocument(
  archiveDocument: ArchiveDocument,
  deps: ConversionHandlerDeps
): Promise<ConversionResult> {
  const metadataValidation = validateMetadata(archiveDocument);
  if (!metadataValidation.complete) {
    return { outcome: "error", error: "INCOMPLETE_METADATA", missingFields: metadataValidation.missingFields };
  }
  if (!isSupportedFormat(archiveDocument.sourceFormat)) {
    return { outcome: "error", error: "UNSUPPORTED_FORMAT" };
  }

  const { stream, contentType } = await deps.documentStorage.download(archiveDocument.id, archiveDocument.version);
  void contentType;
  const extraction = await deps.documentProcessor.extract({ stream, sourceFormat: archiveDocument.sourceFormat });
  const okfRecord = mapExtractionToOkfRecord(archiveDocument, extraction);
  await deps.ingestionQueue.publish({ archiveDocumentId: archiveDocument.id, version: archiveDocument.version });

  return { outcome: "success", okfRecord };
}

export type ConversionAttemptOutcome =
  | { httpStatus: 200; body: { okfRecord: OkfRecord } }
  | { httpStatus: 422; body: { error: "INCOMPLETE_METADATA"; missingFields: string[] } }
  | { httpStatus: 422; body: { error: "UNSUPPORTED_FORMAT" } }
  | { httpStatus: 502; body: { error: "CONVERSION_FAILED" } };

export async function attemptConversion(
  archiveDocument: ArchiveDocument,
  deps: ConversionHandlerDeps,
  store: MemoryStore
): Promise<ConversionAttemptOutcome> {
  const previous = store.pipelineStatuses.get(archiveDocument.id);
  const attempts = previous?.attempts ?? [];

  try {
    const result = await convertDocument(archiveDocument, deps);

    if (result.outcome === "error") {
      const errorDetail = result.error === "INCOMPLETE_METADATA" ? result.missingFields.join(", ") : result.error;
      store.pipelineStatuses.set(archiveDocument.id, {
        archiveDocumentId: archiveDocument.id,
        archiveDocumentVersion: archiveDocument.version,
        batchId: previous?.batchId ?? null,
        stage: "failed",
        lastError: errorDetail,
        attempts: [...attempts, { attemptedAt: new Date().toISOString(), action: "convert", outcome: "failure", errorDetail }]
      });
      return result.error === "INCOMPLETE_METADATA"
        ? { httpStatus: 422, body: { error: "INCOMPLETE_METADATA", missingFields: result.missingFields } }
        : { httpStatus: 422, body: { error: "UNSUPPORTED_FORMAT" } };
    }

    store.okfRecords.set(result.okfRecord.id, result.okfRecord);
    store.pipelineStatuses.set(archiveDocument.id, {
      archiveDocumentId: archiveDocument.id,
      archiveDocumentVersion: archiveDocument.version,
      batchId: previous?.batchId ?? null,
      stage: "converted",
      lastError: null,
      attempts: [...attempts, { attemptedAt: new Date().toISOString(), action: "convert", outcome: "success", errorDetail: null }]
    });
    return { httpStatus: 200, body: { okfRecord: result.okfRecord } };
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : String(error);
    store.pipelineStatuses.set(archiveDocument.id, {
      archiveDocumentId: archiveDocument.id,
      archiveDocumentVersion: archiveDocument.version,
      batchId: previous?.batchId ?? null,
      stage: "failed",
      lastError: errorDetail,
      attempts: [...attempts, { attemptedAt: new Date().toISOString(), action: "convert", outcome: "failure", errorDetail }]
    });
    return { httpStatus: 502, body: { error: "CONVERSION_FAILED" } };
  }
}
