import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccessRequest } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Request to ${url} failed with ${response.status}`);
  }
  return body;
}

export function useSubmitAccessRequest() {
  return useMutation({
    mutationFn: (submission: { name: string; email: string; affiliation?: string; reason: string }) =>
      fetchJson<{ status: string }>("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission)
      })
  });
}

export function usePendingAccessRequests() {
  return useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<{ requests: AccessRequest[] }>("/api/access-requests")
  });
}

export function useDecideAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, decision }: { email: string; decision: "approve" | "deny" }) =>
      fetchJson(`/api/access-requests/${encodeURIComponent(email)}/${decision}`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    }
  });
}
