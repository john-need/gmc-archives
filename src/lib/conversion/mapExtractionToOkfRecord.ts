import { randomUUID } from "node:crypto";
import type { DocumentExtraction } from "@/lib/conversion/documentProcessor";
import type { ArchiveDocument, OkfRecord } from "@/lib/types";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function mapExtractionToOkfRecord(
  archiveDocument: ArchiveDocument,
  extraction: DocumentExtraction
): OkfRecord {
  const conversionWarnings: string[] = [];
  if (extraction.confidence < LOW_CONFIDENCE_THRESHOLD) {
    conversionWarnings.push(`Low extraction confidence: ${extraction.confidence}`);
  }
  return {
    id: randomUUID(),
    archiveDocumentId: archiveDocument.id,
    archiveDocumentVersion: archiveDocument.version,
    title: archiveDocument.title,
    section: archiveDocument.section,
    date: archiveDocument.date,
    sourceIdentifier: archiveDocument.id,
    body: extraction.body,
    author: extraction.author,
    location: extraction.location,
    entities: extraction.entities,
    conversionWarnings
  };
}
