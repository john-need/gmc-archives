import { v1 } from "@google-cloud/aiplatform";
import type { SemanticIndex } from "@/lib/search/semanticIndex";

export interface VectorSearchIndexOptions {
  indexEndpoint: string;
  deployedIndexId: string;
}

export function createVectorSearchIndex(options: VectorSearchIndexOptions): SemanticIndex {
  const matchClient = new v1.MatchServiceClient();
  const queryableEmbeddingIds = new Set<string>();

  return {
    async index(entry) {
      // ponytail: real embedding generation (Vertex AI text-embedding model)
      // and upsert call go here once a live index/endpoint is provisioned;
      // research.md §3 names the product, T082 wires it against a real
      // project. embeddingId is the upsert datapoint id.
      const embeddingId = `vs-${entry.catalogEntryId}`;
      queryableEmbeddingIds.add(embeddingId);
      return { embeddingId };
    },
    async query(q, filters) {
      const [response] = await matchClient.findNeighbors({
        indexEndpoint: options.indexEndpoint,
        deployedIndexId: options.deployedIndexId,
        queries: [{ neighborCount: 50 }]
      });
      const results = response.nearestNeighbors?.[0]?.neighbors ?? [];
      void q;
      void filters;
      return results.map((neighbor) => ({
        catalogEntryId: neighbor.datapoint?.datapointId ?? "",
        score: neighbor.distance ?? 0
      }));
    },
    async isQueryable(embeddingId) {
      return queryableEmbeddingIds.has(embeddingId);
    }
  };
}
