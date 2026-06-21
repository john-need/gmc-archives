import type { ArchiveDocument, Batch, OkfRecord, PipelineStatus } from "@/lib/types";

export interface MemoryStore {
  archiveDocuments: Map<string, ArchiveDocument>;
  okfRecords: Map<string, OkfRecord>;
  pipelineStatuses: Map<string, PipelineStatus>;
  batches: Map<string, Batch>;
}

export function createMemoryStore(seedDocuments: ArchiveDocument[] = []): MemoryStore {
  const archiveDocuments = new Map(seedDocuments.map((doc) => [doc.id, doc]));
  return {
    archiveDocuments,
    okfRecords: new Map(),
    pipelineStatuses: new Map(),
    batches: new Map()
  };
}
