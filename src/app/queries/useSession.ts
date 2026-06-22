import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearAuthToken, setAuthToken } from "@/app/auth/authToken";
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

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/session", { method: "POST" });
      const body: { token: string; user: User } = await response.json();
      setAuthToken(body.token);
      return body.user;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    }
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/session", { method: "DELETE" });
      clearAuthToken();
    },
    onSuccess: () => {
      queryClient.clear();
    }
  });
}
