# Contract: FavoritesStore (`src/lib/favorites`)

Internal library interface backing FR-007/FR-008. The backend
(`src/backend/routes/favorites.ts`) is the only caller.

```ts
interface FavoritesStore {
  list(userId: string): Promise<string[]>; // archiveDocumentIds, favoritedAt-ordered
  isFavorited(userId: string, archiveDocumentId: string): Promise<boolean>;
  add(userId: string, archiveDocumentId: string): Promise<void>;
  remove(userId: string, archiveDocumentId: string): Promise<void>;
}
```

## Contract test requirements

1. `add` followed by `isFavorited` for the same `(userId, archiveDocumentId)`
   returns `true`; `list` includes that `archiveDocumentId`.
2. `add` called twice for the same pair is idempotent — `list` contains
   the id exactly once, not twice (FR-007's "toggle" semantics are
   implemented one layer up by the route, but the store itself must not
   duplicate on a double-add).
3. `remove` for a pair that was never added does not throw.
4. Favorites are scoped per `userId` — adding for one user does not make
   `isFavorited` return `true` for a different `userId` on the same
   document (spec.md: "one user's favorites are not visible to other
   users").
