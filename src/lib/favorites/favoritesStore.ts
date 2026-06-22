export interface FavoritesStore {
  list(userId: string): Promise<string[]>;
  isFavorited(userId: string, archiveDocumentId: string): Promise<boolean>;
  add(userId: string, archiveDocumentId: string): Promise<void>;
  remove(userId: string, archiveDocumentId: string): Promise<void>;
}
