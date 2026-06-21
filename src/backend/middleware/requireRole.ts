import type { Request, RequestHandler } from "express";
import { canAccess } from "@/lib/auth/canAccess";
import type { User, UserRole } from "@/lib/types";

type RequestWithUser = Request & { user?: User | null };

export function requireRole(minimumRole?: UserRole): RequestHandler {
  return (req, res, next) => {
    const user = (req as RequestWithUser).user;
    if (user === null || user === undefined) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    const route = `${req.method} ${req.route?.path ?? req.path}`;
    const requiredRole = minimumRole ?? "viewer";
    if (!canAccess(user.role, route) || (requiredRole === "publisher" && user.role !== "publisher")) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }
    next();
  };
}
