import type { SourceFormat } from "@/lib/types";

const SUPPORTED_FORMATS: SourceFormat[] = ["pdf", "scanned-image", "text", "markdown"];

export function isSupportedFormat(sourceFormat: string): sourceFormat is SourceFormat {
  return (SUPPORTED_FORMATS as string[]).includes(sourceFormat);
}
