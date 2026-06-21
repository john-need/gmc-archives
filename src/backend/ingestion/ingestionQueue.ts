export interface IngestionJob {
  archiveDocumentId: string;
  version: number;
}

export interface IngestionQueue {
  publish(job: IngestionJob): Promise<void>;
}
