import type { GroundingSource } from "@/lib/search/generativeAnswerModel";
import type { CatalogEntry, OkfRecord } from "@/lib/types";

export function buildGroundingSources(
  catalogEntries: CatalogEntry[],
  okfRecords: Map<string, OkfRecord>
): GroundingSource[] {
  const sources: GroundingSource[] = [];
  for (const entry of catalogEntries) {
    const record = okfRecords.get(entry.okfRecordId);
    if (record !== undefined) {
      sources.push({ archiveDocumentId: entry.archiveDocumentId, text: record.body });
    }
  }
  return sources;
}
