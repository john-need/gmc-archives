import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

export async function runUpload(filePath: string, mode: OutputMode): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const buffer = await fs.readFile(filePath);
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), path.basename(filePath));

    const response = await fetch(`${API_BASE_URL}/api/documents`, { method: "POST", body: formData });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? `Upload failed with ${response.status}`);
    }
    writeOutput(json, mode);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
