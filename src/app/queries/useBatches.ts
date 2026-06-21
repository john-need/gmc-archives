import { useQuery } from "@tanstack/react-query";
import type { PipelineStatus } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return response.json();
}

export function useBatchStatus(batchId: string) {
  return useQuery({
    queryKey: ["batches", batchId],
    queryFn: () => fetchJson<{ batchId: string; documents: PipelineStatus[] }>(`/api/batches/${batchId}`)
  });
}
