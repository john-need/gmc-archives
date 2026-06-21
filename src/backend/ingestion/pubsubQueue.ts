import { PubSub } from "@google-cloud/pubsub";
import type { IngestionQueue } from "@/backend/ingestion/ingestionQueue";

export interface PubsubQueueOptions {
  topicName: string;
}

export function createPubsubQueue(options: PubsubQueueOptions): IngestionQueue {
  const pubsub = new PubSub();
  const topic = pubsub.topic(options.topicName);

  return {
    async publish(job) {
      await topic.publishMessage({ json: job });
    }
  };
}
