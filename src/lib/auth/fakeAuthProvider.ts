import type { AuthProvider, AuthSession } from "@/lib/auth/authProvider";
import type { UserDirectory } from "@/lib/access/userDirectory";
import type { IdentityProvider, User, UserRole } from "@/lib/types";

export interface FakeAuthProviderOptions {
  provider?: IdentityProvider;
  role?: UserRole;
  userId?: string;
  email?: string;
  userDirectory?: UserDirectory;
}

export function createFakeAuthProvider(options: FakeAuthProviderOptions = {}): AuthProvider {
  const provider = options.provider ?? "google";
  const userId = options.userId ?? options.email ?? "fake-user";
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
      if (options.userDirectory !== undefined) {
        const role = await options.userDirectory.getRole(options.email ?? userId);
        if (role === null) {
          return null;
        }
        return { id: userId, role, identityProvider: provider };
      }
      const role = options.role ?? "publisher";
      return { id: userId, role, identityProvider: provider };
    }
  };
}
