import express from "express";
import request from "supertest";
import { requireRole } from "@/backend/middleware/requireRole";
import type { User } from "@/lib/types";

function appWithUser(user: User | null): express.Express {
  const app = express();
  app.use((req, _res, next) => {
    (req as express.Request & { user: User | null }).user = user;
    next();
  });
  app.post("/api/documents/:id/convert", requireRole("publisher"), (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.get("/api/documents", requireRole(), (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("requireRole contract", () => {
  it("returns 403 for a Viewer session on a Publisher-only route", async () => {
    const app = appWithUser({ id: "u1", role: "viewer", identityProvider: "google" });
    const response = await request(app).post("/api/documents/doc-1/convert");
    expect(response.status).toBe(403);
  });

  it("allows a Publisher session on a Publisher-only route", async () => {
    const app = appWithUser({ id: "u1", role: "publisher", identityProvider: "google" });
    const response = await request(app).post("/api/documents/doc-1/convert");
    expect(response.status).toBe(200);
  });

  it("allows a Viewer session on a route open to any authenticated role", async () => {
    const app = appWithUser({ id: "u1", role: "viewer", identityProvider: "google" });
    const response = await request(app).get("/api/documents");
    expect(response.status).toBe(200);
  });

  it("returns 401 when there is no session", async () => {
    const app = appWithUser(null);
    const response = await request(app).get("/api/documents");
    expect(response.status).toBe(401);
  });
});
