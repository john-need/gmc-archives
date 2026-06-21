import { useMutation, useQuery } from "@tanstack/react-query";
import type { CatalogEntry } from "@/lib/types";

export interface CatalogSearchParams {
  q: string;
  title?: string;
  section?: string;
  date?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return response.json();
}

export function useCatalogSearch(params: CatalogSearchParams) {
  const query = new URLSearchParams({ q: params.q });
  if (params.title !== undefined) {
    query.set("title", params.title);
  }
  if (params.section !== undefined) {
    query.set("section", params.section);
  }
  if (params.date !== undefined) {
    query.set("date", params.date);
  }
  return useQuery({
    queryKey: ["catalog-search", params],
    queryFn: () => fetchJson<{ results: CatalogEntry[] }>(`/api/catalog/search?${query.toString()}`),
    enabled: params.q.length > 0
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error("SOURCE_UNAVAILABLE");
      }
      return response.blob();
    }
  });
}
