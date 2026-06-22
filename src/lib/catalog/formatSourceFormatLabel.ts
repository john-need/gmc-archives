import type { SourceFormat } from "@/lib/types";

const LABELS: Record<SourceFormat, string> = {
  pdf: "PDF",
  "scanned-image": "SCAN",
  text: "TXT",
  markdown: "MD",
  word: "DOC",
  spreadsheet: "XLS"
};

export function formatSourceFormatLabel(format: SourceFormat): string {
  return LABELS[format];
}
