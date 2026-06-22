import type { UserRole } from "@/lib/types";

export interface UserDirectory {
  getRole(email: string): Promise<UserRole | null>;
  provision(email: string, role: UserRole): Promise<void>;
}
