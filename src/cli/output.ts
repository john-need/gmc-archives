export type OutputMode = "json" | "human";

export function formatOutput(data: unknown, mode: OutputMode): string {
  if (mode === "json") {
    return JSON.stringify(data);
  }
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

export function writeOutput(data: unknown, mode: OutputMode): void {
  process.stdout.write(`${formatOutput(data, mode)}\n`);
}

export function writeError(message: string): void {
  process.stderr.write(`${message}\n`);
}
