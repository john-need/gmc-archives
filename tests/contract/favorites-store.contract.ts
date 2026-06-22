import { createFakeFavoritesStore } from "@/lib/favorites/fakeFavoritesStore";

describe("FavoritesStore contract: fake", () => {
  it("add followed by isFavorited returns true, and list includes the id", async () => {
    const store = createFakeFavoritesStore();
    await store.add("user-1", "doc-1");
    expect(await store.isFavorited("user-1", "doc-1")).toBe(true);
    expect(await store.list("user-1")).toContain("doc-1");
  });

  it("add is idempotent — list contains the id exactly once", async () => {
    const store = createFakeFavoritesStore();
    await store.add("user-1", "doc-1");
    await store.add("user-1", "doc-1");
    const list = await store.list("user-1");
    expect(list.filter((id) => id === "doc-1")).toHaveLength(1);
  });

  it("remove for a pair that was never added does not throw", async () => {
    const store = createFakeFavoritesStore();
    await expect(store.remove("user-1", "doc-1")).resolves.toBeUndefined();
  });

  it("favorites are scoped per user", async () => {
    const store = createFakeFavoritesStore();
    await store.add("user-1", "doc-1");
    expect(await store.isFavorited("user-2", "doc-1")).toBe(false);
  });
});
