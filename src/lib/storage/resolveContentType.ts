import type { SourceFormat } from "@/lib/types";

export function resolveContentType(sourceFormat: SourceFormat, originalMimeType?: string): string {
  switch (sourceFormat) {
    case "pdf":
      return "application/pdf";
    case "text":
      return "text/plain";
    case "markdown":
      return "text/markdown";
    case "scanned-image":
      return originalMimeType ?? "application/octet-stream";
    case "word":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "spreadsheet":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
}
