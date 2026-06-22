import type { SourceFormat } from "@/lib/types";

const EXTENSION_TO_FORMAT: Record<string, SourceFormat> = {
  pdf: "pdf",
  png: "scanned-image",
  jpg: "scanned-image",
  jpeg: "scanned-image",
  tiff: "scanned-image",
  tif: "scanned-image",
  gif: "scanned-image",
  txt: "text",
  md: "markdown",
  doc: "word",
  docx: "word",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet"
};

export function inferSourceFormatFromFilename(filename: string): SourceFormat | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  if (match === null) {
    return null;
  }
  const extension = match[1].toLowerCase();
  return EXTENSION_TO_FORMAT[extension] ?? null;
}
