import { useQuery } from "@tanstack/react-query";
import type { DiscoverabilityStatus } from "@/lib/search/checkDiscoverability";

export function useDiscoverability(archiveDocumentId: string) {
  return useQuery({
    queryKey: ["discoverability", archiveDocumentId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${archiveDocumentId}/discoverability`);
      if (!response.ok) {
        throw new Error(`Discoverability check failed with ${response.status}`);
      }
      const body: { status: DiscoverabilityStatus } = await response.json();
      return body.status;
    }
  });
}
