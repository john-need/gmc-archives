import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/app/auth/authToken";

export interface UploadProgressEntry {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "indexed" | "failed";
  error?: string;
}

function uploadOne(file: File, onProgress: (progress: number) => void): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents");
    const token = getAuthToken();
    if (token !== null) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true });
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText);
        resolve({ ok: false, error: body.error ?? "UPLOAD_FAILED" });
      } catch {
        resolve({ ok: false, error: "UPLOAD_FAILED" });
      }
    });
    xhr.addEventListener("error", () => resolve({ ok: false, error: "UPLOAD_FAILED" }));
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function useUpload() {
  const [uploads, setUploads] = useState<UploadProgressEntry[]>([]);
  const queryClient = useQueryClient();

  const uploadFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setUploads((current) => [...current, { id, name: file.name, progress: 0, status: "uploading" }]);

        uploadOne(file, (progress) => {
          setUploads((current) => current.map((entry) => (entry.id === id ? { ...entry, progress } : entry)));
        }).then((result) => {
          setUploads((current) =>
            current.map((entry) =>
              entry.id === id
                ? { ...entry, progress: 100, status: result.ok ? "indexed" : "failed", error: result.error }
                : entry
            )
          );
          if (result.ok) {
            void queryClient.invalidateQueries({ queryKey: ["documents"] });
          }
        });
      }
    },
    [queryClient]
  );

  return { uploads, uploadFiles };
}
