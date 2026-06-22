import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { AuthProvider } from "@/lib/auth/authProvider";
import { createSessionMiddleware } from "@/backend/middleware/session";
import { createSessionRoutes } from "@/backend/routes/session";
import { requestLogging } from "@/backend/middleware/requestLogging";
import { requireRole } from "@/backend/middleware/requireRole";
import { emitLogEntry } from "@/lib/logging";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { createDocumentsRoutes, createDocumentUploadRoutes, type DocumentsRoutesDeps } from "@/backend/routes/documents";
import { createBatchesRoutes } from "@/backend/routes/batches";
import { createPublishRoutes, type PublishRoutesDeps } from "@/backend/routes/publish";
import { createCatalogRoutes, type CatalogRoutesDeps } from "@/backend/routes/catalog";
import { createDiscoverabilityRoutes, type DiscoverabilityRoutesDeps } from "@/backend/routes/discoverability";
import { createHistoryRoutes } from "@/backend/routes/history";
import { createAskRoutes, type AskRoutesDeps } from "@/backend/routes/ask";
import { createFavoritesRoutes, type FavoritesRoutesDeps } from "@/backend/routes/favorites";
import { createAccessRequestsRoutes, type AccessRequestsRoutesDeps } from "@/backend/routes/accessRequests";
import type { UploadHandlerDeps } from "@/backend/ingestion/uploadHandler";

export interface AppDeps {
  store: MemoryStore;
  authProvider: AuthProvider;
  documentsDeps: DocumentsRoutesDeps;
  publishDeps: PublishRoutesDeps;
  catalogDeps: CatalogRoutesDeps;
  discoverabilityDeps: DiscoverabilityRoutesDeps;
  askDeps: AskRoutesDeps;
  favoritesDeps: FavoritesRoutesDeps;
  uploadDeps: UploadHandlerDeps;
  accessRequestsDeps: AccessRequestsRoutesDeps;
  allowedOrigin: string;
}

// ponytail: sessions are bearer tokens (Authorization header), not cookies —
// there is no cross-site form-post/cookie-CSRF surface to harden, and no
// Google service credential ever reaches src/app (verified by grep, T079).
// CORS is locked to allowedOrigin so no other site can read API responses.
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogging());

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", deps.allowedOrigin);
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(createSessionMiddleware(deps.authProvider));
  app.use(createSessionRoutes(deps.authProvider));

  app.use(["/api/batches", "/api/documents/:id/convert", "/api/documents/:id/publish", "/api/documents/:id/retry"], requireRole("publisher"));

  app.use(createDocumentsRoutes(deps.documentsDeps));
  app.use(createDocumentUploadRoutes(deps.uploadDeps));
  app.use(createBatchesRoutes(deps.documentsDeps));
  app.use(createPublishRoutes(deps.publishDeps));
  app.use(createCatalogRoutes(deps.catalogDeps));
  app.use(createDiscoverabilityRoutes(deps.discoverabilityDeps));
  app.use(createHistoryRoutes({ store: deps.store }));
  app.use(createAskRoutes(deps.askDeps));
  app.use(createFavoritesRoutes(deps.favoritesDeps));
  app.use(createAccessRequestsRoutes(deps.accessRequestsDeps));

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    emitLogEntry({ severity: "ERROR", message: error.message });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
}
