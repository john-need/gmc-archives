import type { CatalogEntry } from "@/lib/types";

export interface StructuredFilters {
  title?: string;
  section?: string;
  date?: string;
}

export function applyStructuredFilters(results: CatalogEntry[], filters: StructuredFilters): CatalogEntry[] {
  return results.filter((entry) => {
    if (filters.title !== undefined && !entry.searchableFields.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }
    if (filters.section !== undefined && entry.searchableFields.section !== filters.section) {
      return false;
    }
    if (filters.date !== undefined && entry.searchableFields.date !== filters.date) {
      return false;
    }
    return true;
  });
}
