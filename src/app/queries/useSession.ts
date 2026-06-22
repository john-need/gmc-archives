import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/types";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("/api/session");
      if (!response.ok) {
        return null;
      }
      const body: { user: User } = await response.json();
      return body.user;
    },
    retry: false
  });
}
