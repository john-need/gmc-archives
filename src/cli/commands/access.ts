import { writeError, writeOutput, type OutputMode } from "@/cli/output";

const API_BASE_URL = process.env.GMC_API_BASE_URL ?? "http://localhost:8080";

export interface RequestAccessArgs {
  name: string;
  email: string;
  affiliation?: string;
  reason: string;
}

export async function runRequestAccess(args: RequestAccessArgs, mode: OutputMode): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/access-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
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

export async function runReviewRequests(mode: OutputMode): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/access-requests`);
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
