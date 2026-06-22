import { Router } from "express";
import type { RequestWithSession } from "@/backend/middleware/session";
import type { AuthProvider } from "@/lib/auth/authProvider";

export function createSessionRoutes(authProvider: AuthProvider): Router {
  const router = Router();

  router.get("/api/session", (req: RequestWithSession, res) => {
    if (req.user === null || req.user === undefined) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    res.status(200).json({ user: req.user });
  });

  // ponytail: the browser never holds a real Google credential here (FR-008);
  // this mints a session against whichever AuthProvider is wired in (fake in
  // dev/tests, real once a live GCP project completes the OAuth handshake).
  router.post("/api/session", async (_req, res) => {
    const session = await authProvider.signIn();
    const user = await authProvider.getCurrentUser(session);
    res.status(200).json({ token: session.token, user });
  });

  router.delete("/api/session", async (req: RequestWithSession, res) => {
    if (req.session) {
      await authProvider.signOut(req.session);
    }
    res.status(204).end();
  });

  return router;
}
