import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

async function postJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ?? `Request to ${path} failed with ${response.status}`);
  }
  return json;
}

export async function runPublish(documentId: string, mode: OutputMode): Promise<void> {
  try {
    const result = await postJson(`/api/documents/${documentId}/publish`);
    writeOutput(result, mode);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export async function runBatchPublish(documentIds: string[], mode: OutputMode): Promise<void> {
  for (const documentId of documentIds) {
    await runPublish(documentId, mode);
  }
}
