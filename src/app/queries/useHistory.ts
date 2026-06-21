import { useQuery } from "@tanstack/react-query";
import type { AttemptRecord } from "@/lib/types";

export interface HistoryParams {
  archiveDocumentId?: string;
  batchId?: string;
}

export function useHistory(params: HistoryParams = {}) {
  const query = new URLSearchParams();
  if (params.archiveDocumentId !== undefined) {
    query.set("archiveDocumentId", params.archiveDocumentId);
  }
  if (params.batchId !== undefined) {
    query.set("batchId", params.batchId);
  }
  const queryString = query.toString();
  return useQuery({
    queryKey: ["history", params],
    queryFn: async () => {
      const response = await fetch(`/api/history${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) {
        throw new Error(`History fetch failed with ${response.status}`);
      }
      const body: { attempts: AttemptRecord[] } = await response.json();
      return body.attempts;
    }
  });
}
