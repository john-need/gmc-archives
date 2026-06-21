import { useState } from "react";
import { DiscoverabilityBadge } from "@/app/components/DiscoverabilityBadge";
import type { CatalogEntry } from "@/lib/types";

export interface CatalogSearchProps {
  results: CatalogEntry[];
  onSearch: (query: string) => void;
  onDownload: (archiveDocumentId: string) => void;
  onSectionFilterChange: (section: string) => void;
}

export function CatalogSearch(props: CatalogSearchProps): JSX.Element {
  const [query, setQuery] = useState("");

  return (
    <main>
      <h1>Catalog Search</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.onSearch(query);
        }}
      >
        <label htmlFor="catalog-search-input">Catalog search</label>
        <input
          id="catalog-search-input"
          type="search"
          aria-label="Catalog search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label htmlFor="catalog-section-filter">Section</label>
        <select
          id="catalog-section-filter"
          aria-label="Section"
          onChange={(event) => props.onSectionFilterChange(event.target.value)}
        >
          <option value="">All sections</option>
          <option value="Newsletters">Newsletters</option>
          <option value="Field Reports">Field Reports</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {props.results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <ul aria-label="Catalog search results">
          {props.results.map((entry) => (
            <li key={entry.catalogEntryId}>
              {entry.searchableFields.title}
              <DiscoverabilityBadge status={entry.agentSearchDiscoverable} />
              <button type="button" onClick={() => props.onDownload(entry.archiveDocumentId)}>
                {`Download ${entry.searchableFields.title}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
