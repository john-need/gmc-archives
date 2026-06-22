import { toggleFavorite } from "@/lib/favorites/toggleFavorite";

describe("toggleFavorite", () => {
  it("returns add when not currently favorited", () => {
    expect(toggleFavorite(false)).toEqual({ action: "add" });
  });

  it("returns remove when currently favorited", () => {
    expect(toggleFavorite(true)).toEqual({ action: "remove" });
  });
});
