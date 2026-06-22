import { useRef, useState } from "react";

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
    <main>
      <h1>Upload</h1>
      <p>Add documents to the catalog. Uploads are indexed automatically so they become searchable right away.</p>
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
      >
        <p>Drop files here or click to browse</p>
        <p>PDF · Word · HTML · Images · Spreadsheets — up to 50 MB each</p>
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
        <ul aria-label="Uploads">
          {props.uploads.map((entry) => (
            <li key={entry.id}>
              <span>{entry.name}</span>
              {entry.status === "indexed" && <span>Indexed · added to catalog</span>}
              {entry.status === "uploading" && <span>{`Uploading… ${entry.progress}%`}</span>}
              {entry.status === "failed" && (
                <span role="alert">{ERROR_MESSAGES[entry.error ?? "UPLOAD_FAILED"]}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
