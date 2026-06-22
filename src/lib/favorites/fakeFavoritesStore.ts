import type { FavoritesStore } from "@/lib/favorites/favoritesStore";

export function createFakeFavoritesStore(): FavoritesStore {
  const favoritesByUser = new Map<string, Set<string>>();

  return {
    async list(userId) {
      return Array.from(favoritesByUser.get(userId) ?? []);
    },
    async isFavorited(userId, archiveDocumentId) {
      return favoritesByUser.get(userId)?.has(archiveDocumentId) ?? false;
    },
    async add(userId, archiveDocumentId) {
      const existing = favoritesByUser.get(userId) ?? new Set<string>();
      existing.add(archiveDocumentId);
      favoritesByUser.set(userId, existing);
    },
    async remove(userId, archiveDocumentId) {
      favoritesByUser.get(userId)?.delete(archiveDocumentId);
    }
  };
}
