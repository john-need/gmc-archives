import { MAX_UPLOAD_SIZE_BYTES, validateUploadFile } from "@/lib/conversion/validateUploadFile";

describe("validateUploadFile", () => {
  it("accepts a supported format under the size limit", () => {
    const result = validateUploadFile({ filename: "report.pdf", sizeBytes: 1024 });
    expect(result).toEqual({ valid: true, sourceFormat: "pdf" });
  });

  it("rejects an unsupported format", () => {
    const result = validateUploadFile({ filename: "archive.exe", sizeBytes: 1024 });
    expect(result).toEqual({ valid: false, error: "UNSUPPORTED_FORMAT" });
  });

  it("rejects a file larger than the 50MB cap", () => {
    const result = validateUploadFile({ filename: "report.pdf", sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1 });
    expect(result).toEqual({ valid: false, error: "FILE_TOO_LARGE", maxBytes: MAX_UPLOAD_SIZE_BYTES });
  });

  it("checks format before size", () => {
    const result = validateUploadFile({ filename: "archive.exe", sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1 });
    expect(result).toEqual({ valid: false, error: "UNSUPPORTED_FORMAT" });
  });
});
