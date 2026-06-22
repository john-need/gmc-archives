import { createFakeAccessRequestStore } from "@/lib/access/fakeAccessRequestStore";

describe("AccessRequestStore contract: fake", () => {
  it("submit creates a pending request; resubmitting while pending updates it instead of duplicating", async () => {
    const store = createFakeAccessRequestStore();
    await store.submit({ email: "a@example.org", name: "A One", affiliation: null, reason: "research" });
    await store.submit({ email: "a@example.org", name: "A Two", affiliation: "GMC", reason: "updated reason" });

    const pending = await store.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].name).toBe("A Two");
    expect(pending[0].affiliation).toBe("GMC");
  });

  it("approve transitions to approved and removes it from listPending", async () => {
    const store = createFakeAccessRequestStore();
    await store.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    const approved = await store.approve("a@example.org", "editor-1");
    expect(approved.status).toBe("approved");
    expect(approved.decidedBy).toBe("editor-1");
    expect(await store.listPending()).toHaveLength(0);
  });

  it("deny transitions to denied and removes it from listPending", async () => {
    const store = createFakeAccessRequestStore();
    await store.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    const denied = await store.deny("a@example.org", "editor-1");
    expect(denied.status).toBe("denied");
    expect(await store.listPending()).toHaveLength(0);
  });

  it("submit after a denial creates a new pending request, not blocked by the prior denial", async () => {
    const store = createFakeAccessRequestStore();
    await store.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "research" });
    await store.deny("a@example.org", "editor-1");
    await store.submit({ email: "a@example.org", name: "A", affiliation: null, reason: "trying again" });
    const pending = await store.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("pending");
  });

  it("getByEmail returns null for an email with no request", async () => {
    const store = createFakeAccessRequestStore();
    expect(await store.getByEmail("nobody@example.org")).toBeNull();
  });

  it("approve throws for an email with no request", async () => {
    const store = createFakeAccessRequestStore();
    await expect(store.approve("nobody@example.org", "editor-1")).rejects.toThrow();
  });

  it("deny throws for an email with no request", async () => {
    const store = createFakeAccessRequestStore();
    await expect(store.deny("nobody@example.org", "editor-1")).rejects.toThrow();
  });
});
