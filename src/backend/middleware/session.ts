import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthProvider, AuthSession } from "@/lib/auth/authProvider";
import type { User } from "@/lib/types";

export type RequestWithSession = Request & { session?: AuthSession | null; user?: User | null };

export function createSessionMiddleware(authProvider: AuthProvider): RequestHandler {
  return (req: RequestWithSession, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace(/^Bearer /, "") ?? null;
    const session: AuthSession | null = token === null ? null : { token, provider: "google" };
    req.session = session;
    authProvider
      .getCurrentUser(session)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(next);
  };
}
