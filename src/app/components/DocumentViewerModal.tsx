import { useEffect, useRef } from "react";
import type { ArchiveDocument } from "@/lib/types";
import { formatSourceFormatLabel } from "@/lib/catalog/formatSourceFormatLabel";
import { badgeStyle, COLORS, primaryButtonStyle, secondaryButtonStyle } from "@/app/styleTokens";

export interface DocumentViewerModalProps {
  document: ArchiveDocument | null | undefined;
  onClose: () => void;
  onDownload: (archiveDocumentId: string) => void;
  onToggleFavorite: (archiveDocumentId: string) => void;
  onAskAboutDocument: (archiveDocumentId: string) => void;
  isFavorited: boolean;
}

const INLINE_PREVIEW_FORMATS = new Set(["pdf", "scanned-image"]);

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(42,30,20,.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  zIndex: 50
};

const PANEL_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 820,
  maxHeight: "86vh",
  background: COLORS.cardAlt,
  borderRadius: 4,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 14px 40px rgba(40,25,15,.26)"
};

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
      <div onClick={props.onClose} style={OVERLAY_STYLE}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Document no longer available"
          onKeyDown={handleKeyDown}
          onClick={(event) => event.stopPropagation()}
          ref={dialogRef}
          tabIndex={-1}
          style={{ ...PANEL_STYLE, maxWidth: 420, padding: 32, textAlign: "center" }}
        >
          <p style={{ margin: "0 0 18px", color: COLORS.textMuted, fontSize: "14.5px" }}>This document is no longer available.</p>
          <button type="button" onClick={props.onClose} style={primaryButtonStyle}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (props.document === undefined) {
    return null;
  }

  const doc = props.document;
  const showInlinePreview = INLINE_PREVIEW_FORMATS.has(doc.sourceFormat);

  return (
    <div onClick={props.onClose} style={OVERLAY_STYLE}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        style={PANEL_STYLE}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.card }}>
          <span style={badgeStyle}>{formatSourceFormatLabel(doc.sourceFormat)}</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, letterSpacing: "-.01em", margin: 0 }}>{doc.title}</h2>
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div
              style={{
                borderRadius: 3,
                border: `1px solid ${COLORS.cardBorder}`,
                minHeight: 360,
                background: "repeating-linear-gradient(135deg, #F4EEE4 0 14px, #FBF8F3 14px 28px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {showInlinePreview ? (
                <span data-testid="inline-preview" style={{ fontFamily: "ui-monospace, monospace", fontSize: "12.5px", color: "#B0A698", background: COLORS.cardAlt, padding: "7px 13px", borderRadius: 2, border: `1px solid ${COLORS.cardBorder}` }}>
                  Preview of {doc.title}
                </span>
              ) : (
                <span data-testid="preview-placeholder" style={{ fontFamily: "ui-monospace, monospace", fontSize: "12.5px", color: "#B0A698", background: COLORS.cardAlt, padding: "7px 13px", borderRadius: 2, border: `1px solid ${COLORS.cardBorder}` }}>
                  {doc.sourceFormat} file — {doc.title}
                </span>
              )}
            </div>
          </div>
          <div style={{ width: 300, flex: "none", borderLeft: `1px solid ${COLORS.cardBorder}`, overflow: "auto", padding: "22px 20px", display: "flex", flexDirection: "column" }}>
            <dl style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13, marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: 0 }}>
                <dt style={{ color: COLORS.textFaint }}>Date</dt>
                <dd style={{ fontWeight: 600, textAlign: "right", margin: 0 }}>{doc.date}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: 0 }}>
                <dt style={{ color: COLORS.textFaint }}>Collection</dt>
                <dd style={{ fontWeight: 600, textAlign: "right", margin: 0 }}>{doc.section}</dd>
              </div>
            </dl>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: "auto" }}>
              <button type="button" onClick={() => props.onDownload(doc.id)} style={secondaryButtonStyle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M5 20h14" />
                </svg>
                Download
              </button>
              <button
                type="button"
                onClick={() => props.onToggleFavorite(doc.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: 10,
                  borderRadius: 3,
                  border: `1px solid ${props.isFavorited ? COLORS.accentBorder : COLORS.border}`,
                  background: props.isFavorited ? COLORS.accentBg : COLORS.card,
                  color: props.isFavorited ? COLORS.accent : COLORS.textNav,
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={props.isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
                </svg>
                {props.isFavorited ? "Unfavorite" : "Favorite"}
              </button>
              <button type="button" onClick={() => props.onAskAboutDocument(doc.id)} style={primaryButtonStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.5 2a7.5 7.5 0 0 1 5.96 12.06l4.24 4.24a1 1 0 0 1-1.41 1.41l-4.24-4.24A7.5 7.5 0 1 1 9.5 2z" />
                </svg>
                Ask about this document
              </button>
              <button type="button" onClick={props.onClose} style={secondaryButtonStyle}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
