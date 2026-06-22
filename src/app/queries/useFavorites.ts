import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toggleFavorite } from "@/lib/favorites/toggleFavorite";
import type { ArchiveDocument } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return response.json();
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetchJson<{ documents: ArchiveDocument[] }>("/api/favorites")
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ archiveDocumentId, isFavorited }: { archiveDocumentId: string; isFavorited: boolean }) => {
      const decision = toggleFavorite(isFavorited);
      const method = decision.action === "add" ? "POST" : "DELETE";
      return fetchJson<{ favorited: boolean }>(`/api/favorites/${archiveDocumentId}`, { method });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  });
}
