import type { CatalogEntry, OkfRecord } from "@/lib/types";

export type PublishDecision =
  | { action: "publish" }
  | { action: "supersede"; entryToSupersede: CatalogEntry }
  | { action: "reject"; reason: "ALREADY_PUBLISHED"; catalogEntryId: string };

export function publishDecision(existingEntries: CatalogEntry[], newRecord: OkfRecord): PublishDecision {
  const sameVersion = existingEntries.find((entry) => entry.version === newRecord.archiveDocumentVersion);
  if (sameVersion !== undefined) {
    return { action: "reject", reason: "ALREADY_PUBLISHED", catalogEntryId: sameVersion.catalogEntryId };
  }

  const currentEntry = existingEntries.find((entry) => entry.status === "current");
  if (currentEntry !== undefined) {
    return { action: "supersede", entryToSupersede: currentEntry };
  }

  return { action: "publish" };
}
