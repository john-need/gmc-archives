import type { AuthProvider, AuthSession } from "@/lib/auth/authProvider";
import type { User, UserRole } from "@/lib/types";

export interface GoogleAuthProviderOptions {
  // ponytail: no live GCP project in this pass; stubBackend swaps the real
  // Cloud Identity/Google Identity Services call for an in-memory session
  // store so the contract suite can run without credentials. Wire a real
  // Cloud Identity token-verification + role-allowlist lookup here when a
  // project is available (research.md §6).
  stubBackend?: boolean;
  roleAllowlist?: Record<string, UserRole>;
}

export function createGoogleAuthProvider(options: GoogleAuthProviderOptions = {}): AuthProvider {
  if (!options.stubBackend) {
    throw new Error("GoogleAuthProvider requires stubBackend until a live GCP project is configured");
  }

  const roleAllowlist = options.roleAllowlist ?? {};
  const activeSessions = new Map<string, string>();

  return {
    async signIn(): Promise<AuthSession> {
      const subjectId = `google-subject-${activeSessions.size + 1}`;
      const token = `token-${subjectId}`;
      activeSessions.set(token, subjectId);
      return { token, provider: "google" };
    },
    async signOut(session: AuthSession): Promise<void> {
      activeSessions.delete(session.token);
    },
    async getCurrentUser(session: AuthSession | null): Promise<User | null> {
      if (session === null) {
        return null;
      }
      const subjectId = activeSessions.get(session.token);
      if (subjectId === undefined) {
        return null;
      }
      const role = roleAllowlist[subjectId] ?? "viewer";
      return { id: subjectId, role, identityProvider: "google" };
    }
  };
}
