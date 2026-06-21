import type { DocumentExtraction } from "@/lib/conversion/documentProcessor";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";

export function createFakeDocumentProcessor(
  defaults: Partial<DocumentExtraction> = {}
): DocumentProcessor {
  return {
    async extract() {
      return {
        body: defaults.body ?? "extracted body text",
        author: defaults.author ?? null,
        location: defaults.location ?? null,
        entities: defaults.entities ?? [],
        confidence: defaults.confidence ?? 0.95
      };
    }
  };
}
