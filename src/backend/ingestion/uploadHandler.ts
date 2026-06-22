import { randomUUID } from "node:crypto";
import { validateUploadFile } from "@/lib/conversion/validateUploadFile";
import { attemptConversion, type ConversionHandlerDeps } from "@/backend/ingestion/conversionHandler";
import { attemptPublish, type PublishRoutesDeps } from "@/backend/routes/publish";
import type { MemoryStore } from "@/backend/store/memoryStore";
import type { ArchiveDocument } from "@/lib/types";

export interface UploadHandlerDeps extends ConversionHandlerDeps, PublishRoutesDeps {
  store: MemoryStore;
}

export type UploadOutcome =
  | { httpStatus: 201; body: { archiveDocumentId: string; catalogEntry: unknown } }
  | { httpStatus: 422; body: { error: "UNSUPPORTED_FORMAT" } }
  | { httpStatus: 422; body: { error: "FILE_TOO_LARGE"; maxBytes: number } }
  | { httpStatus: 502; body: { error: "CONVERSION_FAILED" | "CATALOG_UNAVAILABLE" } };

function deriveTitle(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export async function uploadHandler(
  file: { buffer: Buffer; filename: string; sizeBytes: number },
  metadata: { title?: string; section?: string },
  deps: UploadHandlerDeps
): Promise<UploadOutcome> {
  const validation = validateUploadFile({ filename: file.filename, sizeBytes: file.sizeBytes });
  if (!validation.valid) {
    return validation.error === "UNSUPPORTED_FORMAT"
      ? { httpStatus: 422, body: { error: "UNSUPPORTED_FORMAT" } }
      : { httpStatus: 422, body: { error: "FILE_TOO_LARGE", maxBytes: validation.maxBytes } };
  }

  const archiveDocument: ArchiveDocument = {
    id: randomUUID(),
    title: metadata.title ?? deriveTitle(file.filename),
    section: metadata.section ?? "Uploads",
    date: new Date().toISOString().slice(0, 10),
    sourceFormat: validation.sourceFormat,
    storageObjectPath: "",
    version: 1,
    metadataComplete: true
  };
  deps.store.archiveDocuments.set(archiveDocument.id, archiveDocument);

  await deps.documentStorage.upload(new Blob([new Uint8Array(file.buffer)]), { archiveDocumentId: archiveDocument.id });

  const conversionOutcome = await attemptConversion(archiveDocument, deps, deps.store);
  if (conversionOutcome.httpStatus !== 200) {
    return { httpStatus: 502, body: { error: "CONVERSION_FAILED" } };
  }

  const publishOutcome = await attemptPublish(conversionOutcome.body.okfRecord, deps);
  if (publishOutcome.httpStatus !== 200) {
    return { httpStatus: 502, body: { error: "CATALOG_UNAVAILABLE" } };
  }

  return {
    httpStatus: 201,
    body: { archiveDocumentId: archiveDocument.id, catalogEntry: publishOutcome.body.catalogEntry }
  };
}
