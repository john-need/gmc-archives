import { useState } from "react";
import { deriveCollections } from "@/lib/catalog/deriveCollections";
import type { ArchiveDocument } from "@/lib/types";

export interface LibraryProps {
  documents: ArchiveDocument[];
  favoritedIds: string[];
  onView: (archiveDocumentId: string) => void;
  onDownload: (archiveDocumentId: string) => void;
  onToggleFavorite: (archiveDocumentId: string) => void;
}

export function Library(props: LibraryProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const collections = deriveCollections(props.documents);
  const needle = query.trim().toLowerCase();
  const filteredDocuments = props.documents.filter((doc) => {
    if (collection !== null && doc.section !== collection) {
      return false;
    }
    if (needle.length === 0) {
      return true;
    }
    return (doc.title + " " + doc.section).toLowerCase().includes(needle);
  });

  return (
    <main>
      <h1>Library</h1>
      <label htmlFor="library-search-input">Search the archive</label>
      <input
        id="library-search-input"
        type="search"
        role="searchbox"
        aria-label="Search the archive"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div>
        <button type="button" aria-pressed={collection === null} onClick={() => setCollection(null)}>
          All
        </button>
        {collections.map((name) => (
          <button key={name} type="button" aria-pressed={collection === name} onClick={() => setCollection(name)}>
            {name}
          </button>
        ))}
      </div>
      <div>
        <button type="button" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>
          Grid
        </button>
        <button type="button" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
          List
        </button>
      </div>

      {filteredDocuments.length === 0 ? (
        <p>No documents match your search.</p>
      ) : (
        <ul aria-label="Documents" data-view-mode={viewMode}>
          {filteredDocuments.map((doc) => {
            const isFavorited = props.favoritedIds.includes(doc.id);
            return (
              <li key={doc.id}>
                <span>{doc.title}</span>
                <button type="button" onClick={() => props.onView(doc.id)}>
                  {`View ${doc.title}`}
                </button>
                <button type="button" onClick={() => props.onDownload(doc.id)}>
                  {`Download ${doc.title}`}
                </button>
                <button type="button" onClick={() => props.onToggleFavorite(doc.id)}>
                  {isFavorited ? `Unfavorite ${doc.title}` : `Favorite ${doc.title}`}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
