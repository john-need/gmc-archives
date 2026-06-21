export interface AuthSession {
  token: string;
  provider: "google" | "wordpress";
}

import type { User } from "@/lib/types";

export interface AuthProvider {
  signIn(): Promise<AuthSession>;
  signOut(session: AuthSession): Promise<void>;
  getCurrentUser(session: AuthSession | null): Promise<User | null>;
}
