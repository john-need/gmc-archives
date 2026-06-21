import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { CatalogEntry } from "@/lib/types";

export function createFakeCatalogStore(): CatalogStore {
  const entriesByDocument = new Map<string, CatalogEntry[]>();

  return {
    async getEntriesForDocument(archiveDocumentId) {
      return entriesByDocument.get(archiveDocumentId) ?? [];
    },
    async getEntryById(catalogEntryId) {
      for (const entries of entriesByDocument.values()) {
        const match = entries.find((entry) => entry.catalogEntryId === catalogEntryId);
        if (match !== undefined) {
          return match;
        }
      }
      return null;
    },
    async save(entry) {
      const existing = entriesByDocument.get(entry.archiveDocumentId) ?? [];
      const withoutEntry = existing.filter((candidate) => candidate.catalogEntryId !== entry.catalogEntryId);
      entriesByDocument.set(entry.archiveDocumentId, [...withoutEntry, entry]);
    }
  };
}
