import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import { createGoogleAuthProvider } from "@/lib/auth/googleAuthProvider";
import type { AuthProvider } from "@/lib/auth/authProvider";

function runContractTests(name: string, makeProvider: () => AuthProvider): void {
  describe(`AuthProvider contract: ${name}`, () => {
    let provider: AuthProvider;

    beforeEach(() => {
      provider = makeProvider();
    });

    it("signIn resolves to a session whose provider matches the implementation", async () => {
      const session = await provider.signIn();
      expect(session.provider).toBe(name);
    });

    it("getCurrentUser returns null after signOut", async () => {
      const session = await provider.signIn();
      await provider.signOut(session);
      const user = await provider.getCurrentUser(session);
      expect(user).toBeNull();
    });

    it("getCurrentUser returns a User with a valid role for a signed-in session", async () => {
      const session = await provider.signIn();
      const user = await provider.getCurrentUser(session);
      expect(user).not.toBeNull();
      expect(["viewer", "publisher"]).toContain(user?.role);
    });

    it("getCurrentUser returns null for a null session without throwing", async () => {
      await expect(provider.getCurrentUser(null)).resolves.toBeNull();
    });
  });
}

runContractTests("google", () => createGoogleAuthProvider({ stubBackend: true }));
runContractTests("wordpress", () => createFakeAuthProvider({ provider: "wordpress" }));
