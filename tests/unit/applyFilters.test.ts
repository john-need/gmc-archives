import { applyStructuredFilters } from "@/lib/search/applyFilters";
import type { CatalogEntry } from "@/lib/types";

function entry(overrides: Partial<CatalogEntry["searchableFields"]> = {}): CatalogEntry {
  return {
    catalogEntryId: "entry-1",
    version: 1,
    status: "current",
    okfRecordId: "okf-1",
    archiveDocumentId: "doc-1",
    publishedAt: new Date().toISOString(),
    agentSearchDiscoverable: "pending",
    embeddingId: "embedding-1",
    searchableFields: { title: "Trail Report", section: "Field Reports", date: "1978-03-01", ...overrides }
  };
}

describe("applyStructuredFilters", () => {
  it("returns all results when no filters are given", () => {
    expect(applyStructuredFilters([entry()], {})).toHaveLength(1);
  });

  it("filters by a case-insensitive partial title match", () => {
    expect(applyStructuredFilters([entry()], { title: "trail" })).toHaveLength(1);
    expect(applyStructuredFilters([entry()], { title: "nonexistent" })).toHaveLength(0);
  });

  it("filters by exact date match", () => {
    expect(applyStructuredFilters([entry()], { date: "1978-03-01" })).toHaveLength(1);
    expect(applyStructuredFilters([entry()], { date: "1979-01-01" })).toHaveLength(0);
  });

  it("filters by exact section match", () => {
    expect(applyStructuredFilters([entry()], { section: "Field Reports" })).toHaveLength(1);
    expect(applyStructuredFilters([entry()], { section: "Newsletters" })).toHaveLength(0);
  });
});
