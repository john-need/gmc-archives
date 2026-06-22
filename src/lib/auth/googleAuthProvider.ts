import type { AuthProvider, AuthSession } from "@/lib/auth/authProvider";
import type { UserDirectory } from "@/lib/access/userDirectory";
import type { User, UserRole } from "@/lib/types";

export interface GoogleAuthProviderOptions {
  // ponytail: no live GCP project in this pass; stubBackend swaps the real
  // Cloud Identity/Google Identity Services call for an in-memory session
  // store so the contract suite can run without credentials. Wire a real
  // Cloud Identity token-verification + role-allowlist lookup here when a
  // project is available (research.md §6).
  stubBackend?: boolean;
  roleAllowlist?: Record<string, UserRole>;
  // When provided, role resolution is delegated to the UserDirectory
  // (FR-018/FR-019: only emails approved via the access-request workflow
  // resolve to a role; anyone else is treated as unprovisioned rather than
  // defaulting to "viewer"). Absent userDirectory preserves the prior
  // default-to-viewer behavior for backward compatibility.
  userDirectory?: UserDirectory;
  email?: string;
}

export function createGoogleAuthProvider(options: GoogleAuthProviderOptions = {}): AuthProvider {
  if (!options.stubBackend) {
    throw new Error("GoogleAuthProvider requires stubBackend until a live GCP project is configured");
  }

  const roleAllowlist = options.roleAllowlist ?? {};
  const activeSessions = new Map<string, string>();

  return {
    async signIn(): Promise<AuthSession> {
      const subjectId = options.email ?? `google-subject-${activeSessions.size + 1}`;
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
      if (options.userDirectory !== undefined) {
        const role = await options.userDirectory.getRole(subjectId);
        if (role === null) {
          return null;
        }
        return { id: subjectId, role, identityProvider: "google" };
      }
      const role = roleAllowlist[subjectId] ?? "viewer";
      return { id: subjectId, role, identityProvider: "google" };
    }
  };
}
