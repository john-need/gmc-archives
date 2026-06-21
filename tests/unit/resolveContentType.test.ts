import { resolveContentType } from "@/lib/storage/resolveContentType";

describe("resolveContentType", () => {
  it.each([
    ["pdf", undefined, "application/pdf"],
    ["text", undefined, "text/plain"],
    ["markdown", undefined, "text/markdown"],
    ["scanned-image", "image/tiff", "image/tiff"],
    ["scanned-image", undefined, "application/octet-stream"]
  ] as const)("resolves %s (%s) to %s", (sourceFormat, originalMimeType, expected) => {
    expect(resolveContentType(sourceFormat, originalMimeType)).toBe(expected);
  });
});
