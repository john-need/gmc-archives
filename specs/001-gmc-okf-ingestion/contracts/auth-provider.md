# Contract: AuthProvider Interface (`src/lib/auth`)

Implemented by `GoogleAuthProvider` (backed by Cloud Identity / Google
Identity Services, research.md §6) now; designed to be implemented by a
future `WordPressAuthProvider` without changes to callers (FR-001b).
`FakeAuthProvider` exists for contract/unit tests only.

```ts
interface AuthProvider {
  signIn(): Promise<AuthSession>;
  signOut(session: AuthSession): Promise<void>;
  getCurrentUser(session: AuthSession): Promise<User | null>;
}

interface AuthSession {
  token: string;
  provider: "google" | "wordpress";
}

interface User {
  id: string;
  role: "viewer" | "publisher";
  identityProvider: "google" | "wordpress";
}
```

## Contract test requirements

Every `AuthProvider` implementation MUST pass the same contract test suite
(`tests/contract/auth-provider.contract.ts`), run against both
`GoogleAuthProvider` (with a stubbed Google identity backend) and
`FakeAuthProvider`, asserting:

1. `signIn()` resolves to a session whose `provider` matches the
   implementation.
2. `getCurrentUser()` returns `null` after `signOut()`.
3. `getCurrentUser()` returns a `User` with a valid `role` for a signed-in
   session — role resolution logic (e.g., allowlist lookup) is internal to
   each provider and not part of this contract.
4. No implementation throws for a `null`/expired session passed to
   `getCurrentUser()` — it returns `null` instead.

Passing this suite for any new provider (e.g., a future
`WordPressAuthProvider`) is the acceptance bar for FR-001b's swappability
requirement — no caller code should need to change.
