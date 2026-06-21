import { Storage } from "@google-cloud/storage";
import type { DocumentStorage } from "@/lib/storage/documentStorage";

export interface CloudStorageAdapterOptions {
  bucketName: string;
}

export function createCloudStorageAdapter(options: CloudStorageAdapterOptions): DocumentStorage {
  const storage = new Storage();
  const bucket = storage.bucket(options.bucketName);

  return {
    async upload(file, meta) {
      const existing = await bucket.getFiles({ prefix: `${meta.archiveDocumentId}/v` });
      const version = existing[0].length + 1;
      const objectPath = `${meta.archiveDocumentId}/v${version}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await bucket.file(objectPath).save(buffer, { contentType: file.type || "application/octet-stream" });
      return { storageObjectPath: objectPath, version };
    },
    async download(archiveDocumentId, version) {
      const [files] = await bucket.getFiles({ prefix: `${archiveDocumentId}/v` });
      const target = version === undefined
        ? files.sort((a, b) => a.name.localeCompare(b.name)).pop()
        : files.find((f) => f.name === `${archiveDocumentId}/v${version}`);
      if (target === undefined) {
        throw new Error(`SOURCE_UNAVAILABLE: ${archiveDocumentId} v${version ?? "latest"}`);
      }
      const [metadata] = await target.getMetadata();
      const nodeStream = target.createReadStream();
      const stream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (error) => controller.error(error));
        }
      });
      return { stream, contentType: metadata.contentType ?? "application/octet-stream" };
    }
  };
}
