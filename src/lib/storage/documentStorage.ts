export interface DocumentStorage {
  upload(
    file: Blob,
    meta: { archiveDocumentId: string }
  ): Promise<{ storageObjectPath: string; version: number }>;
  download(
    archiveDocumentId: string,
    version?: number
  ): Promise<{ stream: ReadableStream; contentType: string }>;
}
