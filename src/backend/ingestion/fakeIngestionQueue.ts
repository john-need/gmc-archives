import type { IngestionJob, IngestionQueue } from "@/backend/ingestion/ingestionQueue";

export function createFakeIngestionQueue(onPublish?: (job: IngestionJob) => void): IngestionQueue {
  return {
    async publish(job) {
      onPublish?.(job);
    }
  };
}
