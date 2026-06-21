import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { AuthProvider } from "@/lib/auth/authProvider";
import { createSessionMiddleware } from "@/backend/middleware/session";
import { createSessionRoutes } from "@/backend/routes/session";
import { requestLogging } from "@/backend/middleware/requestLogging";
import { emitLogEntry } from "@/lib/logging";

export function createApp(authProvider: AuthProvider): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogging());
  app.use(createSessionMiddleware(authProvider));
  app.use(createSessionRoutes());

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    emitLogEntry({ severity: "ERROR", message: error.message });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
}
