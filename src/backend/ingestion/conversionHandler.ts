import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";
import type { IngestionQueue } from "@/backend/ingestion/ingestionQueue";
import { validateMetadata } from "@/lib/conversion/validateMetadata";
import { isSupportedFormat } from "@/lib/conversion/isSupportedFormat";
import { mapExtractionToOkfRecord } from "@/lib/conversion/mapExtractionToOkfRecord";
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
