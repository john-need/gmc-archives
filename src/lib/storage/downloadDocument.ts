import { resolveContentType } from "@/lib/storage/resolveContentType";
import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { ArchiveDocument } from "@/lib/types";

export interface DownloadDocumentDeps {
  documentStorage: DocumentStorage;
}

export async function downloadDocument(
  archiveDocument: ArchiveDocument,
  version: number | undefined,
  deps: DownloadDocumentDeps
): Promise<{ stream: ReadableStream; contentType: string }> {
  const { stream, contentType: originalMimeType } = await deps.documentStorage.download(archiveDocument.id, version);
  return { stream, contentType: resolveContentType(archiveDocument.sourceFormat, originalMimeType) };
}
