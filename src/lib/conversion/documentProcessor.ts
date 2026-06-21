import type { SourceFormat } from "@/lib/types";

export interface DocumentExtraction {
  body: string;
  author: string | null;
  location: string | null;
  entities: string[];
  confidence: number;
}

export interface DocumentProcessor {
  extract(file: { stream: ReadableStream; sourceFormat: SourceFormat }): Promise<DocumentExtraction>;
}
