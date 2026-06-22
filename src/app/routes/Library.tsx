import { useState } from "react";
import { deriveCollections } from "@/lib/catalog/deriveCollections";
import { formatSourceFormatLabel } from "@/lib/catalog/formatSourceFormatLabel";
import type { ArchiveDocument } from "@/lib/types";
import { badgeStyle, cardStyle, chipStyle, COLORS, favoriteButtonStyle, headerStyle, inputStyle, pageStyle, secondaryButtonStyle, toggleButtonStyle } from "@/app/styleTokens";

export interface LibraryProps {
  documents: ArchiveDocument[];
  favoritedIds: string[];
  onView: (archiveDocumentId: string) => void;
  onDownload: (archiveDocumentId: string) => void;
  onToggleFavorite: (archiveDocumentId: string) => void;
}

function FavoriteIcon(props: { active: boolean }): JSX.Element {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={props.active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
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
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>Library</h2>
      </header>
      <div style={pageStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <label htmlFor="library-search-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
              Search the archive
            </label>
            <input
              id="library-search-input"
              type="search"
              role="searchbox"
              aria-label="Search the archive"
              placeholder="Search the archive by title or collection…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: 4, background: COLORS.sidebar, borderRadius: 3, padding: 3 }}>
            <button type="button" aria-pressed={viewMode === "grid"} title="Grid" onClick={() => setViewMode("grid")} style={toggleButtonStyle(viewMode === "grid")}>
              Grid
            </button>
            <button type="button" aria-pressed={viewMode === "list"} title="List" onClick={() => setViewMode("list")} style={toggleButtonStyle(viewMode === "list")}>
              List
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          <button type="button" aria-pressed={collection === null} onClick={() => setCollection(null)} style={chipStyle(collection === null)}>
            All
          </button>
          {collections.map((name) => (
            <button key={name} type="button" aria-pressed={collection === name} onClick={() => setCollection(name)} style={chipStyle(collection === name)}>
              {name}
            </button>
          ))}
        </div>

        {filteredDocuments.length === 0 ? (
          <p style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textFaint, fontSize: 15 }}>No documents match your search.</p>
        ) : viewMode === "grid" ? (
          <ul aria-label="Documents" data-view-mode={viewMode} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredDocuments.map((doc) => {
              const isFavorited = props.favoritedIds.includes(doc.id);
              return (
                <li key={doc.id} style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 13 }}>
                    <span style={badgeStyle}>{formatSourceFormatLabel(doc.sourceFormat)}</span>
                    <button type="button" onClick={() => props.onToggleFavorite(doc.id)} style={favoriteButtonStyle(isFavorited)}>
                      <FavoriteIcon active={isFavorited} />
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
                        {isFavorited ? `Unfavorite ${doc.title}` : `Favorite ${doc.title}`}
                      </span>
                    </button>
                  </div>
                  <button type="button" onClick={() => props.onView(doc.id)} style={{ textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer", marginBottom: 8 }}>
                    <span style={{ fontSize: "15.5px", fontWeight: 600, lineHeight: 1.3, color: COLORS.text }}>{doc.title}</span>
                  </button>
                  <div style={{ fontSize: "11.5px", color: COLORS.textFaint, marginBottom: 14, flex: 1 }}>
                    {doc.section} &middot; {doc.date}
                  </div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", borderTop: "1px solid #F0E9DD", paddingTop: 13 }}>
                    <button type="button" onClick={() => props.onView(doc.id)} style={secondaryButtonStyle}>
                      {`View ${doc.title}`}
                    </button>
                    <button type="button" title="Download" onClick={() => props.onDownload(doc.id)} style={{ width: 34, height: 34, borderRadius: 2, border: "1px solid #E6DDD0", background: COLORS.cardAlt, color: COLORS.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 4v11" />
                        <path d="m7 11 5 5 5-5" />
                        <path d="M5 20h14" />
                      </svg>
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>{`Download ${doc.title}`}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul aria-label="Documents" data-view-mode={viewMode} style={{ ...cardStyle, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
            {filteredDocuments.map((doc) => {
              const isFavorited = props.favoritedIds.includes(doc.id);
              return (
                <li key={doc.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderBottom: "1px solid #F2ECE2" }}>
                  <span style={{ ...badgeStyle, flex: "none", width: 46, textAlign: "center" }}>{formatSourceFormatLabel(doc.sourceFormat)}</span>
                  <button
                    type="button"
                    onClick={() => props.onView(doc.id)}
                    aria-label={`View ${doc.title}`}
                    style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                  >
                    <div style={{ fontSize: "14.5px", fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.section} &middot; {doc.date}
                    </div>
                  </button>
                  <div style={{ display: "flex", gap: 4, flex: "none" }}>
                    <button type="button" onClick={() => props.onToggleFavorite(doc.id)} style={favoriteButtonStyle(isFavorited)}>
                      <FavoriteIcon active={isFavorited} />
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
                        {isFavorited ? `Unfavorite ${doc.title}` : `Favorite ${doc.title}`}
                      </span>
                    </button>
                    <button type="button" title="Download" onClick={() => props.onDownload(doc.id)} style={{ width: 32, height: 32, border: "none", background: "transparent", color: COLORS.textNav, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 4v11" />
                        <path d="m7 11 5 5 5-5" />
                        <path d="M5 20h14" />
                      </svg>
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>{`Download ${doc.title}`}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
