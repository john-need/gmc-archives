import express from "express";
import request from "supertest";
import { createSessionMiddleware } from "@/backend/middleware/session";
import { createSessionRoutes } from "@/backend/routes/session";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";

describe("GET /api/session", () => {
  it("returns the current user when authenticated", async () => {
    const authProvider = createFakeAuthProvider({ role: "publisher" });
    const session = await authProvider.signIn();
    const app = express();
    app.use(createSessionMiddleware(authProvider));
    app.use(createSessionRoutes());

    const response = await request(app).get("/api/session").set("Authorization", `Bearer ${session.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("publisher");
  });

  it("returns 401 when there is no session", async () => {
    const authProvider = createFakeAuthProvider();
    const app = express();
    app.use(createSessionMiddleware(authProvider));
    app.use(createSessionRoutes());

    const response = await request(app).get("/api/session");
    expect(response.status).toBe(401);
  });
});
