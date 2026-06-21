import { randomUUID } from "node:crypto";
import { publishDecision } from "@/lib/catalog/publishDecision";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { CatalogEntry, OkfRecord } from "@/lib/types";

export interface PublishHandlerDeps {
  catalogStore: CatalogStore;
  semanticIndex: SemanticIndex;
}

export type PublishResult =
  | { outcome: "success"; catalogEntry: CatalogEntry }
  | { outcome: "error"; error: "ALREADY_PUBLISHED"; catalogEntryId: string };

export async function publishRecord(okfRecord: OkfRecord, deps: PublishHandlerDeps): Promise<PublishResult> {
  const existingEntries = await deps.catalogStore.getEntriesForDocument(okfRecord.archiveDocumentId);
  const decision = publishDecision(existingEntries, okfRecord);

  if (decision.action === "reject") {
    return { outcome: "error", error: "ALREADY_PUBLISHED", catalogEntryId: decision.catalogEntryId };
  }

  if (decision.action === "supersede") {
    await deps.catalogStore.save({ ...decision.entryToSupersede, status: "superseded" });
  }

  const catalogEntryId = randomUUID();
  const { embeddingId } = await deps.semanticIndex.index({
    catalogEntryId,
    text: `${okfRecord.title} ${okfRecord.body}`
  });

  const catalogEntry: CatalogEntry = {
    catalogEntryId,
    version: okfRecord.archiveDocumentVersion,
    status: "current",
    okfRecordId: okfRecord.id,
    archiveDocumentId: okfRecord.archiveDocumentId,
    publishedAt: new Date().toISOString(),
    agentSearchDiscoverable: "pending",
    embeddingId,
    searchableFields: { title: okfRecord.title, section: okfRecord.section, date: okfRecord.date }
  };

  await deps.catalogStore.save(catalogEntry);
  return { outcome: "success", catalogEntry };
}
