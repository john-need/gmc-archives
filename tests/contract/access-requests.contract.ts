import express from "express";
import request from "supertest";
import { createAccessRequestsRoutes } from "@/backend/routes/accessRequests";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";
import type { User } from "@/lib/types";

function buildApp(user: User | null) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { user: User | null }).user = user;
    next();
  });
  const accessRequestStore = createFakeAccessRequestStore();
  const userDirectory = createFakeUserDirectory();
  app.use(createAccessRequestsRoutes({ accessRequestStore, userDirectory }));
  return { app, accessRequestStore, userDirectory };
}

const editor: User = { id: "editor-1", role: "publisher", identityProvider: "google" };
const researcher: User = { id: "researcher-1", role: "viewer", identityProvider: "google" };

describe("Access request routes", () => {
  it("POST /api/access-requests submits a request without requiring authentication", async () => {
    const { app } = buildApp(null);
    const response = await request(app)
      .post("/api/access-requests")
      .send({ name: "A One", email: "a@example.org", reason: "research" });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("pending");
  });

  it("POST /api/access-requests returns 422 INVALID_REQUEST for missing fields or a bad email", async () => {
    const { app } = buildApp(null);
    const missingField = await request(app).post("/api/access-requests").send({ name: "A", reason: "x" });
    expect(missingField.status).toBe(422);
    expect(missingField.body.error).toBe("INVALID_REQUEST");

    const badEmail = await request(app)
      .post("/api/access-requests")
      .send({ name: "A", email: "not-an-email", reason: "x" });
    expect(badEmail.status).toBe(422);
  });

  it("GET /api/access-requests is Editor-only — 403 for a Researcher", async () => {
    const { app } = buildApp(researcher);
    const response = await request(app).get("/api/access-requests");
    expect(response.status).toBe(403);
  });

  it("GET /api/access-requests lists pending requests for an Editor", async () => {
    const { app, accessRequestStore } = buildApp(editor);
    await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    const response = await request(app).get("/api/access-requests");
    expect(response.status).toBe(200);
    expect(response.body.requests).toHaveLength(1);
  });

  it("POST /api/access-requests/:email/approve provisions a user — Editor-only", async () => {
    const { app, accessRequestStore, userDirectory } = buildApp(editor);
    await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    const response = await request(app).post("/api/access-requests/a@example.org/approve");
    expect(response.status).toBe(200);
    expect(typeof response.body.provisionedUserId).toBe("string");
    expect(await userDirectory.getRole("a@example.org")).toBe("viewer");
  });

  it("POST /api/access-requests/:email/approve returns 404 for an unknown email", async () => {
    const { app } = buildApp(editor);
    const response = await request(app).post("/api/access-requests/nobody@example.org/approve");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("REQUEST_NOT_FOUND");
  });

  it("POST /api/access-requests/:email/approve returns 409 for an already-decided request", async () => {
    const { app, accessRequestStore } = buildApp(editor);
    await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    await accessRequestStore.approve("a@example.org", "editor-1");
    const response = await request(app).post("/api/access-requests/a@example.org/approve");
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("ALREADY_DECIDED");
  });

  it("POST /api/access-requests/:email/deny marks the request denied — Editor-only", async () => {
    const { app, accessRequestStore } = buildApp(editor);
    await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    const response = await request(app).post("/api/access-requests/a@example.org/deny");
    expect(response.status).toBe(200);
    expect(response.body.request.status).toBe("denied");
  });

  it("POST /api/access-requests/:email/deny is Editor-only — 403 for a Researcher", async () => {
    const { app } = buildApp(researcher);
    const response = await request(app).post("/api/access-requests/a@example.org/deny");
    expect(response.status).toBe(403);
  });

  it("POST /api/access-requests/:email/deny returns 404 for an unknown email", async () => {
    const { app } = buildApp(editor);
    const response = await request(app).post("/api/access-requests/nobody@example.org/deny");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("REQUEST_NOT_FOUND");
  });

  it("POST /api/access-requests/:email/deny returns 409 for an already-decided request", async () => {
    const { app, accessRequestStore } = buildApp(editor);
    await accessRequestStore.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    await accessRequestStore.deny("a@example.org", "editor-1");
    const response = await request(app).post("/api/access-requests/a@example.org/deny");
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("ALREADY_DECIDED");
  });
});
