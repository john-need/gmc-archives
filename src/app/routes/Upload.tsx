import { useRef, useState } from "react";
import { COLORS, dropZoneStyle, headerStyle, pageStyle } from "@/app/styleTokens";

export interface UploadEntry {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "indexed" | "failed";
  error?: string;
}

export interface UploadProps {
  isPermitted: boolean;
  uploads: UploadEntry[];
  onFilesSelected: (files: File[]) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  UNSUPPORTED_FORMAT: "Unsupported format.",
  FILE_TOO_LARGE: "File too large.",
  UPLOAD_FAILED: "Upload failed."
};

export function Upload(props: UploadProps): JSX.Element | null {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!props.isPermitted) {
    return null;
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>Upload</h2>
      </header>
      <div style={pageStyle}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ margin: "0 0 20px", color: COLORS.textMuted, fontSize: 15, lineHeight: 1.55 }}>
            Add documents to the catalog. Uploads are indexed automatically so they become searchable right away.
          </p>
          <div
            data-drag-active={isDragActive}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              props.onFilesSelected(Array.from(event.dataTransfer.files));
            }}
            style={dropZoneStyle(isDragActive)}
          >
            <div style={{ width: 48, height: 48, borderRadius: 3, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V5" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 19h14" />
              </svg>
            </div>
            <p style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 600 }}>Drop files here or click to browse</p>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textFaint }}>PDF · Word · HTML · Images · Spreadsheets — up to 50 MB each</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            aria-label="Choose files to upload"
            style={{ display: "none" }}
            onChange={(event) => {
              if (event.target.files !== null) {
                props.onFilesSelected(Array.from(event.target.files));
              }
            }}
          />

          {props.uploads.length > 0 && (
            <ul aria-label="Uploads" style={{ listStyle: "none", margin: "26px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {props.uploads.map((entry) => (
                <li key={entry.id} style={{ border: `1px solid ${COLORS.cardBorder}`, borderRadius: 3, background: COLORS.card, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</div>
                      {entry.status === "indexed" && <div style={{ fontSize: 12, color: COLORS.success, marginTop: 2 }}>Indexed · added to catalog</div>}
                      {entry.status === "uploading" && <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 2 }}>{`Uploading… ${entry.progress}%`}</div>}
                      {entry.status === "failed" && (
                        <div role="alert" style={{ fontSize: 12, color: COLORS.danger, marginTop: 2 }}>
                          {ERROR_MESSAGES[entry.error ?? "UPLOAD_FAILED"]}
                        </div>
                      )}
                    </div>
                    {entry.status === "indexed" && (
                      <span style={{ flex: "none", width: 24, height: 24, borderRadius: "50%", background: COLORS.successBg, color: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 11, height: 6, borderRadius: 999, background: "#F0E9DD", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, entry.status === "failed" ? entry.progress : entry.status === "indexed" ? 100 : entry.progress)}%`,
                        borderRadius: 999,
                        background: entry.status === "indexed" ? "#7BA86F" : entry.status === "failed" ? COLORS.danger : COLORS.accent
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
