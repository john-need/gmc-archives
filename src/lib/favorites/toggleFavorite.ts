export function toggleFavorite(isFavorited: boolean): { action: "add" | "remove" } {
  return { action: isFavorited ? "remove" : "add" };
}
