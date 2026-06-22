import type { ArchiveDocument } from "@/lib/types";
import { formatSourceFormatLabel } from "@/lib/catalog/formatSourceFormatLabel";
import { badgeStyle, cardStyle, COLORS, headerStyle, pageStyle, primaryButtonStyle, secondaryButtonStyle } from "@/app/styleTokens";

export interface FavoritesProps {
  documents: ArchiveDocument[];
  onView: (archiveDocumentId: string) => void;
  onDownload: (archiveDocumentId: string) => void;
  onUnfavorite: (archiveDocumentId: string) => void;
  onGoToLibrary: () => void;
}

export function Favorites(props: FavoritesProps): JSX.Element {
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>Favorites</h2>
      </header>
      <div style={pageStyle}>
        {props.documents.length === 0 ? (
          <div style={{ maxWidth: 420, margin: "70px auto 0", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, margin: "0 auto 18px", borderRadius: 4, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 700 }}>No favorites yet</h2>
            <p style={{ margin: "0 0 20px", color: COLORS.textMuted, fontSize: "14.5px", lineHeight: 1.5 }}>
              Bookmark a document from the Library to keep it close at hand.
            </p>
            <button type="button" onClick={props.onGoToLibrary} style={primaryButtonStyle}>
              Browse the Library
            </button>
          </div>
        ) : (
          <ul aria-label="Favorited documents" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {props.documents.map((doc) => (
              <li key={doc.id} style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 13 }}>
                  <span style={badgeStyle}>{formatSourceFormatLabel(doc.sourceFormat)}</span>
                  <button
                    type="button"
                    onClick={() => props.onUnfavorite(doc.id)}
                    title="Unfavorite"
                    style={{ width: 30, height: 30, border: "none", background: "transparent", color: COLORS.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
                    </svg>
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>{`Unfavorite ${doc.title}`}</span>
                  </button>
                </div>
                <button type="button" onClick={() => props.onView(doc.id)} style={{ textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer", marginBottom: 8 }}>
                  <span style={{ fontSize: "15.5px", fontWeight: 600, lineHeight: 1.3, color: COLORS.text }}>{doc.title}</span>
                </button>
                <div style={{ fontSize: "11.5px", color: COLORS.textFaint, marginBottom: 14, flex: 1 }}>
                  {doc.section} &middot; {doc.date}
                </div>
                <div style={{ display: "flex", gap: 7, borderTop: "1px solid #F0E9DD", paddingTop: 13 }}>
                  <button type="button" onClick={() => props.onView(doc.id)} style={secondaryButtonStyle}>
                    {`View ${doc.title}`}
                  </button>
                  <button
                    type="button"
                    title="Download"
                    onClick={() => props.onDownload(doc.id)}
                    style={{ width: 34, height: 34, borderRadius: 2, border: "1px solid #E6DDD0", background: COLORS.cardAlt, color: COLORS.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 4v11" />
                      <path d="m7 11 5 5 5-5" />
                      <path d="M5 20h14" />
                    </svg>
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>{`Download ${doc.title}`}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
