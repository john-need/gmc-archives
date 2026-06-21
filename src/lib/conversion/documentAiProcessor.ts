import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";

export interface DocumentAiProcessorOptions {
  processorName: string;
}

async function readAll(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export function createDocumentAiProcessor(options: DocumentAiProcessorOptions): DocumentProcessor {
  const client = new DocumentProcessorServiceClient();

  return {
    async extract(file) {
      const content = await readAll(file.stream);
      const [result] = await client.processDocument({
        name: options.processorName,
        rawDocument: { content, mimeType: "application/pdf" }
      });
      const document = result.document;
      const entities = document?.entities ?? [];
      const findEntity = (type: string): string | null =>
        entities.find((entity) => entity.type === type)?.mentionText ?? null;
      return {
        body: document?.text ?? "",
        author: findEntity("author"),
        location: findEntity("location"),
        entities: entities.map((entity) => entity.mentionText ?? "").filter(Boolean),
        confidence: document?.textChanges?.[0]?.changedText !== undefined ? 0.5 : 0.95
      };
    }
  };
}
