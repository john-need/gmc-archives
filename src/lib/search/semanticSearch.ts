import { applyStructuredFilters, type StructuredFilters } from "@/lib/search/applyFilters";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { CatalogEntry } from "@/lib/types";

export interface SemanticSearchDeps {
  semanticIndex: SemanticIndex;
  catalogStore: CatalogStore;
}

export interface SemanticSearchOptions extends StructuredFilters {
  includeSuperseded?: boolean;
}

export async function semanticSearch(
  query: string,
  options: SemanticSearchOptions,
  deps: SemanticSearchDeps
): Promise<CatalogEntry[]> {
  const matches = await deps.semanticIndex.query(query, options);
  const entries: CatalogEntry[] = [];
  for (const match of matches) {
    const entry = await deps.catalogStore.getEntryById(match.catalogEntryId);
    if (entry !== null) {
      entries.push(entry);
    }
  }

  const visibleEntries = options.includeSuperseded ? entries : entries.filter((entry) => entry.status === "current");
  return applyStructuredFilters(visibleEntries, options);
}
