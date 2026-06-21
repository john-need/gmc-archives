import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

export async function runStatus(documentId: string, mode: OutputMode): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/discoverability`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? `Status check failed with ${response.status}`);
    }
    writeOutput(json, mode);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
