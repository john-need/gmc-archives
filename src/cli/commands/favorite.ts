import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

async function callFavoriteEndpoint(method: "POST" | "DELETE", documentId: string, mode: OutputMode): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites/${documentId}`, { method });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? `Request failed with ${response.status}`);
    }
    writeOutput(json, mode);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export async function runFavorite(documentId: string, mode: OutputMode): Promise<void> {
  await callFavoriteEndpoint("POST", documentId, mode);
}

export async function runUnfavorite(documentId: string, mode: OutputMode): Promise<void> {
  await callFavoriteEndpoint("DELETE", documentId, mode);
}
