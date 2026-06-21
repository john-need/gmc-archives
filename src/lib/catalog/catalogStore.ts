import type { CatalogEntry } from "@/lib/types";

export interface CatalogStore {
  getEntriesForDocument(archiveDocumentId: string): Promise<CatalogEntry[]>;
  getEntryById(catalogEntryId: string): Promise<CatalogEntry | null>;
  save(entry: CatalogEntry): Promise<void>;
}
