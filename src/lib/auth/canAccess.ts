import type { UserRole } from "@/lib/types";

const PUBLISHER_ONLY_ROUTES = [
  /^POST \/api\/batches$/,
  /^GET \/api\/batches\/[^/]+$/,
  /^POST \/api\/documents\/[^/]+\/convert$/,
  /^POST \/api\/documents\/[^/]+\/publish$/,
  /^POST \/api\/documents\/[^/]+\/retry$/
];

export function canAccess(role: UserRole, route: string): boolean {
  if (role === "publisher") {
    return true;
  }
  return !PUBLISHER_ONLY_ROUTES.some((pattern) => pattern.test(route));
}
