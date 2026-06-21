import type { SemanticIndex } from "@/lib/search/semanticIndex";

export type DiscoverabilityStatus = "pending" | "discoverable";

export async function checkDiscoverability(embeddingId: string, semanticIndex: SemanticIndex): Promise<DiscoverabilityStatus> {
  const queryable = await semanticIndex.isQueryable(embeddingId);
  return queryable ? "discoverable" : "pending";
}
