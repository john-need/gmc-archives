import { useEffect, useRef } from "react";
import type { ArchiveDocument } from "@/lib/types";

export interface DocumentViewerModalProps {
  document: ArchiveDocument | null | undefined;
  onClose: () => void;
  onDownload: (archiveDocumentId: string) => void;
  onToggleFavorite: (archiveDocumentId: string) => void;
  onAskAboutDocument: (archiveDocumentId: string) => void;
  isFavorited: boolean;
}

const INLINE_PREVIEW_FORMATS = new Set(["pdf", "scanned-image"]);

export function DocumentViewerModal(props: DocumentViewerModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerFocusRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      triggerFocusRef.current?.focus();
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      props.onClose();
      return;
    }
    if (event.key !== "Tab" || dialogRef.current === null) {
      return;
    }
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && globalThis.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && globalThis.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (props.document === null) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Document no longer available" onKeyDown={handleKeyDown} ref={dialogRef} tabIndex={-1}>
        <p>This document is no longer available.</p>
        <button type="button" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  }

  if (props.document === undefined) {
    return null;
  }

  const doc = props.document;
  const showInlinePreview = INLINE_PREVIEW_FORMATS.has(doc.sourceFormat);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
      tabIndex={-1}
    >
      <h2>{doc.title}</h2>
      {showInlinePreview ? (
        <div data-testid="inline-preview">Preview of {doc.title}</div>
      ) : (
        <div data-testid="preview-placeholder">{doc.sourceFormat} file — {doc.title}</div>
      )}
      <dl>
        <dt>Date</dt>
        <dd>{doc.date}</dd>
        <dt>Collection</dt>
        <dd>{doc.section}</dd>
      </dl>
      <button type="button" onClick={() => props.onDownload(doc.id)}>
        Download
      </button>
      <button type="button" onClick={() => props.onToggleFavorite(doc.id)}>
        {props.isFavorited ? "Unfavorite" : "Favorite"}
      </button>
      <button type="button" onClick={() => props.onAskAboutDocument(doc.id)}>
        Ask about this document
      </button>
      <button type="button" onClick={props.onClose}>
        Close
      </button>
    </div>
  );
}
