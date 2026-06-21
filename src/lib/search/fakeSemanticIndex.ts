import type { SemanticIndex, SemanticIndexFilters, SemanticIndexMatch } from "@/lib/search/semanticIndex";

export interface FakeSemanticIndexOptions {
  queryableAfterMs?: number;
}

interface IndexedEntry {
  catalogEntryId: string;
  text: string;
  readyAt: number;
}

export function createFakeSemanticIndex(options: FakeSemanticIndexOptions = {}): SemanticIndex {
  const queryableAfterMs = options.queryableAfterMs ?? 0;
  const entriesByEmbeddingId = new Map<string, IndexedEntry>();
  let counter = 0;

  return {
    async index(entry) {
      counter += 1;
      const embeddingId = `embedding-${counter}`;
      entriesByEmbeddingId.set(embeddingId, {
        catalogEntryId: entry.catalogEntryId,
        text: entry.text,
        readyAt: Date.now() + queryableAfterMs
      });
      return { embeddingId };
    },
    async query(q: string, _filters?: SemanticIndexFilters): Promise<SemanticIndexMatch[]> {
      const queryTerms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const matches: SemanticIndexMatch[] = [];
      for (const entry of entriesByEmbeddingId.values()) {
        const text = entry.text.toLowerCase();
        const score = queryTerms.filter((term) => text.includes(term)).length / Math.max(queryTerms.length, 1);
        if (score > 0) {
          matches.push({ catalogEntryId: entry.catalogEntryId, score });
        }
      }
      return matches.sort((a, b) => b.score - a.score);
    },
    async isQueryable(embeddingId: string): Promise<boolean> {
      const entry = entriesByEmbeddingId.get(embeddingId);
      if (entry === undefined) {
        return false;
      }
      return Date.now() >= entry.readyAt;
    }
  };
}
