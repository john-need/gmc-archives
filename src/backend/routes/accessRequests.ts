import { Router } from "express";
import { validateAccessRequestSubmission } from "@/lib/access/accessRequestDecision";
import { requireRole } from "@/backend/middleware/requireRole";
import type { AccessRequestStore } from "@/lib/access/accessRequestStore";
import type { UserDirectory } from "@/lib/access/userDirectory";

export interface AccessRequestsRoutesDeps {
  accessRequestStore: AccessRequestStore;
  userDirectory: UserDirectory;
}

export function createAccessRequestsRoutes(deps: AccessRequestsRoutesDeps): Router {
  const router = Router();

  router.post("/api/access-requests", async (req, res) => {
    const submission = {
      name: req.body?.name,
      email: req.body?.email,
      reason: req.body?.reason
    };
    const validation = validateAccessRequestSubmission(submission);
    if (!validation.valid) {
      res.status(422).json({ error: "INVALID_REQUEST", missingFields: validation.missingFields });
      return;
    }
    await deps.accessRequestStore.submit({
      email: req.body.email.trim(),
      name: req.body.name.trim(),
      affiliation: req.body?.affiliation?.trim() || null,
      reason: req.body.reason.trim()
    });
    res.status(200).json({ status: "pending" });
  });

  router.get("/api/access-requests", requireRole("publisher"), async (_req, res) => {
    const requests = await deps.accessRequestStore.listPending();
    res.status(200).json({ requests });
  });

  router.post("/api/access-requests/:email/approve", requireRole("publisher"), async (req, res) => {
    const existing = await deps.accessRequestStore.getByEmail(req.params.email);
    if (existing === null) {
      res.status(404).json({ error: "REQUEST_NOT_FOUND" });
      return;
    }
    if (existing.status !== "pending") {
      res.status(409).json({ error: "ALREADY_DECIDED" });
      return;
    }
    const decidedBy = (req as unknown as { user: { id: string } }).user.id;
    const request = await deps.accessRequestStore.approve(req.params.email, decidedBy);
    await deps.userDirectory.provision(req.params.email, "viewer");
    res.status(200).json({ request, provisionedUserId: req.params.email });
  });

  router.post("/api/access-requests/:email/deny", requireRole("publisher"), async (req, res) => {
    const existing = await deps.accessRequestStore.getByEmail(req.params.email);
    if (existing === null) {
      res.status(404).json({ error: "REQUEST_NOT_FOUND" });
      return;
    }
    if (existing.status !== "pending") {
      res.status(409).json({ error: "ALREADY_DECIDED" });
      return;
    }
    const decidedBy = (req as unknown as { user: { id: string } }).user.id;
    const request = await deps.accessRequestStore.deny(req.params.email, decidedBy);
    res.status(200).json({ request });
  });

  return router;
}
