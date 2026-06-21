import type { AuthProvider, AuthSession } from "@/lib/auth/authProvider";
import type { IdentityProvider, User, UserRole } from "@/lib/types";

export interface FakeAuthProviderOptions {
  provider?: IdentityProvider;
  role?: UserRole;
  userId?: string;
}

export function createFakeAuthProvider(options: FakeAuthProviderOptions = {}): AuthProvider {
  const provider = options.provider ?? "google";
  const role = options.role ?? "publisher";
  const userId = options.userId ?? "fake-user";
  const activeSessions = new Set<string>();

  return {
    async signIn(): Promise<AuthSession> {
      const session: AuthSession = { token: userId, provider };
      activeSessions.add(session.token);
      return session;
    },
    async signOut(session: AuthSession): Promise<void> {
      activeSessions.delete(session.token);
    },
    async getCurrentUser(session: AuthSession | null): Promise<User | null> {
      if (session === null || !activeSessions.has(session.token)) {
        return null;
      }
      return { id: userId, role, identityProvider: provider };
    }
  };
}
