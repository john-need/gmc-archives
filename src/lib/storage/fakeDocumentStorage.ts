import type { DocumentStorage } from "@/lib/storage/documentStorage";

interface StoredVersion {
  version: number;
  bytes: Buffer;
  contentType: string;
}

export function createFakeDocumentStorage(): DocumentStorage {
  const objects = new Map<string, StoredVersion[]>();

  return {
    async upload(file, meta) {
      const existing = objects.get(meta.archiveDocumentId) ?? [];
      const version = existing.length + 1;
      const bytes = Buffer.from(await file.arrayBuffer());
      const contentType = file.type || "application/octet-stream";
      objects.set(meta.archiveDocumentId, [...existing, { version, bytes, contentType }]);
      return { storageObjectPath: `${meta.archiveDocumentId}/v${version}`, version };
    },
    async download(archiveDocumentId, version) {
      const versions = objects.get(archiveDocumentId);
      if (versions === undefined || versions.length === 0) {
        throw new Error(`SOURCE_UNAVAILABLE: ${archiveDocumentId}`);
      }
      const target = version === undefined ? versions[versions.length - 1] : versions.find((v) => v.version === version);
      if (target === undefined) {
        throw new Error(`SOURCE_UNAVAILABLE: ${archiveDocumentId} v${version}`);
      }
      const { bytes, contentType } = target;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(bytes));
          controller.close();
        }
      });
      return { stream, contentType };
    }
  };
}
