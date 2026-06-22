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
    app.use(createSessionRoutes(authProvider));

    const response = await request(app).get("/api/session").set("Authorization", `Bearer ${session.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("publisher");
  });

  it("returns 401 when there is no session", async () => {
    const authProvider = createFakeAuthProvider();
    const app = express();
    app.use(createSessionMiddleware(authProvider));
    app.use(createSessionRoutes(authProvider));

    const response = await request(app).get("/api/session");
    expect(response.status).toBe(401);
  });
});

describe("POST /api/session", () => {
  it("signs in and returns a bearer token usable for GET /api/session", async () => {
    const authProvider = createFakeAuthProvider({ role: "publisher" });
    const app = express();
    app.use(createSessionMiddleware(authProvider));
    app.use(createSessionRoutes(authProvider));

    const signInResponse = await request(app).post("/api/session");
    expect(signInResponse.status).toBe(200);
    expect(typeof signInResponse.body.token).toBe("string");
    expect(signInResponse.body.user.role).toBe("publisher");

    const sessionResponse = await request(app)
      .get("/api/session")
      .set("Authorization", `Bearer ${signInResponse.body.token}`);
    expect(sessionResponse.status).toBe(200);
  });
});

describe("DELETE /api/session", () => {
  it("signs out, invalidating the token for subsequent requests", async () => {
    const authProvider = createFakeAuthProvider({ role: "publisher" });
    const app = express();
    app.use(createSessionMiddleware(authProvider));
    app.use(createSessionRoutes(authProvider));

    const signInResponse = await request(app).post("/api/session");
    const token = signInResponse.body.token;

    const signOutResponse = await request(app).delete("/api/session").set("Authorization", `Bearer ${token}`);
    expect(signOutResponse.status).toBe(204);

    const sessionResponse = await request(app).get("/api/session").set("Authorization", `Bearer ${token}`);
    expect(sessionResponse.status).toBe(401);
  });
});
