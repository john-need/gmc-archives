import { mapExtractionToOkfRecord } from "@/lib/conversion/mapExtractionToOkfRecord";
import { semanticSearch } from "@/lib/search/semanticSearch";
import { createFakeSemanticIndex } from "@/lib/search/fakeSemanticIndex";
import { createFakeDocumentStorage } from "@/lib/storage/fakeDocumentStorage";
import { createFakeCatalogStore } from "@/lib/catalog/fakeCatalogStore";
import { createFakeAuthProvider } from "@/lib/auth/fakeAuthProvider";
import { createGoogleAuthProvider } from "@/lib/auth/googleAuthProvider";
import { createFakeUserDirectory } from "@/lib/access/fakeUserDirectory";
import type { ArchiveDocument, CatalogEntry } from "@/lib/types";

describe("mapExtractionToOkfRecord", () => {
  it("adds a conversionWarning when extraction confidence is low", () => {
    const document: ArchiveDocument = {
      id: "doc-1",
      title: "Doc",
      section: "Newsletters",
      date: "1978-03-01",
      sourceFormat: "scanned-image",
      storageObjectPath: "doc-1/v1",
      version: 1,
      metadataComplete: true
    };
    const record = mapExtractionToOkfRecord(document, {
      body: "garbled",
      author: null,
      location: null,
      entities: [],
      confidence: 0.2
    });
    expect(record.conversionWarnings).toHaveLength(1);
  });
});

describe("semanticSearch", () => {
  it("includes superseded entries when includeSuperseded is true", async () => {
    const semanticIndex = createFakeSemanticIndex();
    const catalogStore = createFakeCatalogStore();
    const entry: CatalogEntry = {
      catalogEntryId: "entry-1",
      version: 1,
      status: "superseded",
      okfRecordId: "okf-1",
      archiveDocumentId: "doc-1",
      publishedAt: new Date().toISOString(),
      agentSearchDiscoverable: "discoverable",
      embeddingId: "embedding-1",
      searchableFields: { title: "Trail Report", section: "Field Reports", date: "1978-03-01" }
    };
    await catalogStore.save(entry);
    await semanticIndex.index({ catalogEntryId: "entry-1", text: "trail report" });

    const withoutSuperseded = await semanticSearch("trail report", {}, { semanticIndex, catalogStore });
    expect(withoutSuperseded).toHaveLength(0);

    const withSuperseded = await semanticSearch("trail report", { includeSuperseded: true }, { semanticIndex, catalogStore });
    expect(withSuperseded).toHaveLength(1);
  });
});

describe("createFakeSemanticIndex", () => {
  it("isQueryable returns false for an unknown embeddingId", async () => {
    const index = createFakeSemanticIndex();
    expect(await index.isQueryable("unknown")).toBe(false);
  });
});

describe("createFakeDocumentStorage", () => {
  it("throws SOURCE_UNAVAILABLE when the requested version does not exist", async () => {
    const storage = createFakeDocumentStorage();
    await storage.upload(new Blob(["v1"]), { archiveDocumentId: "doc-1" });
    await expect(storage.download("doc-1", 99)).rejects.toThrow("SOURCE_UNAVAILABLE");
  });
});

describe("createFakeCatalogStore", () => {
  it("getEntryById returns null when no entry matches", async () => {
    const store = createFakeCatalogStore();
    expect(await store.getEntryById("unknown")).toBeNull();
  });
});

describe("createFakeAuthProvider", () => {
  it("getCurrentUser returns null for a session that was never signed in", async () => {
    const provider = createFakeAuthProvider();
    const user = await provider.getCurrentUser({ token: "never-issued", provider: "google" });
    expect(user).toBeNull();
  });
});

describe("createGoogleAuthProvider", () => {
  it("throws when stubBackend is not set, since there is no live GCP project", () => {
    expect(() => createGoogleAuthProvider()).toThrow(/stubBackend/);
  });

  it("getCurrentUser returns null for an unrecognized token", async () => {
    const provider = createGoogleAuthProvider({ stubBackend: true });
    const user = await provider.getCurrentUser({ token: "unrecognized", provider: "google" });
    expect(user).toBeNull();
  });

  it("resolves a role from the allowlist when provided", async () => {
    const provider = createGoogleAuthProvider({ stubBackend: true, roleAllowlist: {} });
    const session = await provider.signIn();
    const user = await provider.getCurrentUser(session);
    await provider.signOut(session);
    const afterSignOut = await provider.getCurrentUser(session);
    expect(user?.role).toBe("viewer");
    expect(afterSignOut).toBeNull();
  });

  it("resolves a role via userDirectory when provided, scoped by email", async () => {
    const userDirectory = createFakeUserDirectory();
    await userDirectory.provision("a@example.org", "viewer");
    const provider = createGoogleAuthProvider({ stubBackend: true, userDirectory, email: "a@example.org" });
    const session = await provider.signIn();
    const user = await provider.getCurrentUser(session);
    expect(user?.role).toBe("viewer");
  });

  it("returns null via userDirectory when the email has no provisioned role (unprovisioned)", async () => {
    const userDirectory = createFakeUserDirectory();
    const provider = createGoogleAuthProvider({ stubBackend: true, userDirectory, email: "nobody@example.org" });
    const session = await provider.signIn();
    const user = await provider.getCurrentUser(session);
    expect(user).toBeNull();
  });
});
