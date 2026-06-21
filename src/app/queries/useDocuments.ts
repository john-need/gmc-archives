import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ArchiveDocument, OkfRecord } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return response.json();
}

export function useDocuments(params: { section?: string; q?: string } = {}) {
  const query = new URLSearchParams();
  if (params.section !== undefined) {
    query.set("section", params.section);
  }
  if (params.q !== undefined) {
    query.set("q", params.q);
  }
  const queryString = query.toString();
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () =>
      fetchJson<{ documents: ArchiveDocument[] }>(`/api/documents${queryString ? `?${queryString}` : ""}`)
  });
}

export function useConvertDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      fetchJson<{ okfRecord: OkfRecord }>(`/api/documents/${documentId}/convert`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });
}
