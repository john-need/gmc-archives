import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeDocumentProcessor } from "@/lib/conversion/fakeDocumentProcessor";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";

function textBlob(text: string): Blob {
  return new Blob([text], { type: "text/plain" });
}

async function readAll(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf-8");
}

describe("DocumentStorage contract: fake", () => {
  it("upload followed by download returns the same bytes and contentType", async () => {
    const storage = createFakeDocumentStorage();
    await storage.upload(textBlob("hello"), { archiveDocumentId: "doc-1" });
    const result = await storage.download("doc-1");
    expect(await readAll(result.stream)).toBe("hello");
    expect(result.contentType).toBe("text/plain");
  });

  it("uploading a corrected file increments version and keeps the prior version's object", async () => {
    const storage = createFakeDocumentStorage();
    const first = await storage.upload(textBlob("v1"), { archiveDocumentId: "doc-2" });
    const second = await storage.upload(textBlob("v2"), { archiveDocumentId: "doc-2" });
    expect(second.version).toBe(first.version + 1);
    const v1 = await storage.download("doc-2", first.version);
    expect(await readAll(v1.stream)).toBe("v1");
    const v2 = await storage.download("doc-2", second.version);
    expect(await readAll(v2.stream)).toBe("v2");
  });
});

describe("DocumentProcessor contract: fake", () => {
  it("returns low confidence for corrupted input rather than silently accepting garbage text", async () => {
    const processor = createFakeDocumentProcessor({
      confidence: 0.1,
      body: "garbled???"
    });
    const result = await processor.extract({
      stream: new ReadableStream(),
      sourceFormat: "scanned-image"
    });
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe("SemanticIndex contract: fake", () => {
  it("query for a query with no relevant indexed entries returns [] and never throws", async () => {
    const index = createFakeSemanticIndex();
    await expect(index.query("nothing matches this")).resolves.toEqual([]);
  });

  it("isQueryable returns false immediately after index() and true once ready", async () => {
    const index = createFakeSemanticIndex({ queryableAfterMs: 10 });
    const { embeddingId } = await index.index({ catalogEntryId: "entry-1", text: "trail report" });
    expect(await index.isQueryable(embeddingId)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await index.isQueryable(embeddingId)).toBe(true);
  });
});
