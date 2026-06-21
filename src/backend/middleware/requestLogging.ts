import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { emitLogEntry } from "@/lib/logging";

export function requestLogging(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    const startedAt = Date.now();
    res.on("finish", () => {
      emitLogEntry({
        severity: res.statusCode >= 500 ? "ERROR" : "INFO",
        message: `${req.method} ${req.path} ${res.statusCode}`,
        requestId,
        durationMs: Date.now() - startedAt
      });
    });
    next();
  };
}
