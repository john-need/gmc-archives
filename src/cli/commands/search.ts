import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

export async function runSearch(query: string, mode: OutputMode): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/search?q=${encodeURIComponent(query)}`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? `Search failed with ${response.status}`);
    }
    writeOutput(json, mode);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export async function runDownload(documentId: string, outputPath: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download`);
    if (!response.ok) {
      throw new Error(`Download failed with ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const fs = await import("node:fs/promises");
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
