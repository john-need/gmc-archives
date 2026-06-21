export interface LogEntry {
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

export function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function emitLogEntry(entry: LogEntry): void {
  // Cloud Logging on App Engine parses structured JSON written to stdout/stderr.
  const line = formatLogEntry(entry);
  if (entry.severity === "ERROR") {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}
