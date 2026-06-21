import { Router } from "express";
import type { RequestWithSession } from "@/backend/middleware/session";

export function createSessionRoutes(): Router {
  const router = Router();

  router.get("/api/session", (req: RequestWithSession, res) => {
    if (req.user === null || req.user === undefined) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    res.status(200).json({ user: req.user });
  });

  return router;
}
