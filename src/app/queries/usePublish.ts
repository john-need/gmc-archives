import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CatalogEntry, PipelineStatus } from "@/lib/types";

async function postJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "POST" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return body;
}

export function usePublishDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => postJson<{ catalogEntry: CatalogEntry }>(`/api/documents/${documentId}/publish`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });
}

export function useRetryOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => postJson<{ pipelineStatus: PipelineStatus }>(`/api/documents/${documentId}/retry`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });
}
