import { inferSourceFormatFromFilename } from "@/lib/conversion/inferSourceFormatFromFilename";
import type { SourceFormat } from "@/lib/types";

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

export type UploadValidationResult =
  | { valid: true; sourceFormat: SourceFormat }
  | { valid: false; error: "UNSUPPORTED_FORMAT" }
  | { valid: false; error: "FILE_TOO_LARGE"; maxBytes: number };

export function validateUploadFile(file: { filename: string; sizeBytes: number }): UploadValidationResult {
  const sourceFormat = inferSourceFormatFromFilename(file.filename);
  if (sourceFormat === null) {
    return { valid: false, error: "UNSUPPORTED_FORMAT" };
  }
  if (file.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: "FILE_TOO_LARGE", maxBytes: MAX_UPLOAD_SIZE_BYTES };
  }
  return { valid: true, sourceFormat };
}
