import express from "express";
import request from "supertest";
import { createAccessRequestsRoutes } from "@/backend/routes/accessRequests";
import { createSessionMiddleware } from "@/backend/middleware/session";
import { createSessionRoutes } from "@/backend/routes/session";
import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import type { User } from "@/lib/types";

function buildApp(userDirectory: ReturnType<typeof createFakeUserDirectory>, email: string) {
  const editorApp = express();
  editorApp.use(express.json());
  const editor: User = { id: "editor-1", role: "publisher", identityProvider: "google" };
  editorApp.use((req, _res, next) => {
    (req as express.Request & { user: User }).user = editor;
    next();
  });
  const accessRequestStore = createFakeAccessRequestStore();
  editorApp.use(createAccessRequestsRoutes({ accessRequestStore, userDirectory }));

  const authProvider = createFakeAuthProvider({ email, userDirectory });
  const sessionApp = express();
  sessionApp.use(createSessionMiddleware(authProvider));
  sessionApp.use(createSessionRoutes(authProvider));

  return { editorApp, sessionApp, authProvider };
}

describe("access request approval flow", () => {
  it("approve provisions the requester, who can then sign in successfully as a Researcher", async () => {
    const userDirectory = createFakeUserDirectory();
    const { editorApp, sessionApp, authProvider } = buildApp(userDirectory, "a@example.org");

    await request(editorApp).post("/api/access-requests").send({ name: "A", email: "a@example.org", reason: "research" });
    const approveResponse = await request(editorApp).post("/api/access-requests/a@example.org/approve");
    expect(approveResponse.status).toBe(200);

    const session = await authProvider.signIn();
    const sessionResponse = await request(sessionApp).get("/api/session").set("Authorization", `Bearer ${session.token}`);
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.user.role).toBe("viewer");
  });

  it("a denied requester's next sign-in attempt is unprovisioned (no session granted)", async () => {
    const userDirectory = createFakeUserDirectory();
    const { editorApp, sessionApp, authProvider } = buildApp(userDirectory, "b@example.org");

    await request(editorApp).post("/api/access-requests").send({ name: "B", email: "b@example.org", reason: "research" });
    const denyResponse = await request(editorApp).post("/api/access-requests/b@example.org/deny");
    expect(denyResponse.status).toBe(200);

    const session = await authProvider.signIn();
    const sessionResponse = await request(sessionApp).get("/api/session").set("Authorization", `Bearer ${session.token}`);
    expect(sessionResponse.status).toBe(401);
  });
});
