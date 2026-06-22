import type { UserDirectory } from "@/lib/access/userDirectory";
import type { UserRole } from "@/lib/types";

export function createFakeUserDirectory(): UserDirectory {
  const rolesByEmail = new Map<string, UserRole>();

  return {
    async getRole(email) {
      return rolesByEmail.get(email) ?? null;
    },
    async provision(email, role) {
      rolesByEmail.set(email, role);
    }
  };
}
