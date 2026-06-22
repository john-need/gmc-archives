import type { ArchiveDocument } from "@/lib/types";

export interface FavoritesProps {
  documents: ArchiveDocument[];
  onView: (archiveDocumentId: string) => void;
  onDownload: (archiveDocumentId: string) => void;
  onUnfavorite: (archiveDocumentId: string) => void;
  onGoToLibrary: () => void;
}

export function Favorites(props: FavoritesProps): JSX.Element {
  return (
    <main>
      <h1>Favorites</h1>
      {props.documents.length === 0 ? (
        <div>
          <h2>No favorites yet</h2>
          <p>Bookmark a document from the Library to keep it close at hand.</p>
          <button type="button" onClick={props.onGoToLibrary}>
            Browse the Library
          </button>
        </div>
      ) : (
        <ul aria-label="Favorited documents">
          {props.documents.map((doc) => (
            <li key={doc.id}>
              <span>{doc.title}</span>
              <button type="button" onClick={() => props.onView(doc.id)}>
                {`View ${doc.title}`}
              </button>
              <button type="button" onClick={() => props.onDownload(doc.id)}>
                {`Download ${doc.title}`}
              </button>
              <button type="button" onClick={() => props.onUnfavorite(doc.id)}>
                {`Unfavorite ${doc.title}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
