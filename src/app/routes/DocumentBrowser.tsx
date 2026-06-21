import type { ArchiveDocument } from "@/lib/types";

export interface DocumentBrowserProps {
  documents: ArchiveDocument[];
  onSelectDocument: (documentId: string) => void;
  onConvertDocument: (documentId: string) => void;
}

export function DocumentBrowser(props: DocumentBrowserProps): JSX.Element {
  return (
    <main>
      <h1>Archive Documents</h1>
      <ul aria-label="Archive documents">
        {props.documents.map((document) => (
          <li key={document.id}>
            <button type="button" onClick={() => props.onConvertDocument(document.id)}>
              {`Convert ${document.title}`}
            </button>
            <button type="button" onClick={() => props.onSelectDocument(document.id)}>
              {document.title}
            </button>
            {!document.metadataComplete && <span role="alert">Missing metadata — cannot convert yet</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
