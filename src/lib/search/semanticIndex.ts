export interface SemanticIndexMatch {
  catalogEntryId: string;
  score: number;
}

export interface SemanticIndexFilters {
  title?: string;
  section?: string;
  date?: string;
}

export interface SemanticIndex {
  index(entry: { catalogEntryId: string; text: string }): Promise<{ embeddingId: string }>;
  query(q: string, filters?: SemanticIndexFilters): Promise<SemanticIndexMatch[]>;
  isQueryable(embeddingId: string): Promise<boolean>;
}
