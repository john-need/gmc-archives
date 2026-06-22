import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAsk } from "@/app/queries/useAsk";
import { useFavorites, useToggleFavorite } from "@/app/queries/useFavorites";
import { useSession, useSignIn, useSignOut } from "@/app/queries/useSession";
import { getAuthToken, setAuthToken } from "@/app/auth/authToken";
import {
  useDecideAccessRequest,
  usePendingAccessRequests,
  useSubmitAccessRequest
} from "@/app/queries/useAccessRequests";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function mockFetchOnce(status: number, body: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

describe("useAsk", () => {
  it("posts the question and maps sources to numbered citations", async () => {
    mockFetchOnce(200, {
      answer: "It was completed in 1930.",
      sources: [{ archiveDocumentId: "doc-1", title: "Trail Report", snippet: "..." }]
    });
    const { result } = renderHook(() => useAsk(), { wrapper });
    result.current.mutate("When?");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      text: "It was completed in 1930.",
      sources: [{ n: 1, title: "Trail Report", archiveDocumentId: "doc-1" }]
    });
  });

  it("throws ASK_FAILED on a non-OK response", async () => {
    mockFetchOnce(502, { error: "ASK_FAILED" });
    const { result } = renderHook(() => useAsk(), { wrapper });
    result.current.mutate("When?");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useFavorites / useToggleFavorite", () => {
  it("lists favorited documents", async () => {
    mockFetchOnce(200, { documents: [{ id: "doc-1" }] });
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.documents).toHaveLength(1);
  });

  it("calls POST when not favorited, DELETE when favorited", async () => {
    mockFetchOnce(200, { favorited: true });
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });
    result.current.mutate({ archiveDocumentId: "doc-1", isFavorited: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/favorites/doc-1", { method: "POST" });

    mockFetchOnce(200, { favorited: false });
    result.current.mutate({ archiveDocumentId: "doc-1", isFavorited: true });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/favorites/doc-1", { method: "DELETE" }));
  });

  it("surfaces an error when the list request fails", async () => {
    mockFetchOnce(500, { error: "INTERNAL_ERROR" });
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("surfaces an error when toggling fails", async () => {
    mockFetchOnce(404, { error: "DOCUMENT_NOT_FOUND" });
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });
    result.current.mutate({ archiveDocumentId: "doc-1", isFavorited: false });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useSession", () => {
  it("returns the current user when authenticated", async () => {
    mockFetchOnce(200, { user: { id: "u1", role: "viewer", identityProvider: "google" } });
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("u1");
  });

  it("returns null when unauthenticated, without throwing", async () => {
    mockFetchOnce(401, { error: "UNAUTHENTICATED" });
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("useSignIn / useSignOut", () => {
  it("stores the returned token and invalidates the session query on sign-in", async () => {
    mockFetchOnce(200, { token: "abc123", user: { id: "u1", role: "viewer", identityProvider: "google" } });
    const { result } = renderHook(() => useSignIn(), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/session", { method: "POST" });
    expect(getAuthToken()).toBe("abc123");
  });

  it("clears the stored token and the query cache on sign-out", async () => {
    setAuthToken("abc123");
    mockFetchOnce(204, {});
    const { result } = renderHook(() => useSignOut(), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/session", { method: "DELETE" });
    expect(getAuthToken()).toBeNull();
  });
});

describe("useAccessRequests", () => {
  it("submits an access request", async () => {
    mockFetchOnce(200, { status: "pending" });
    const { result } = renderHook(() => useSubmitAccessRequest(), { wrapper });
    result.current.mutate({ name: "A", email: "a@example.org", reason: "research" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("lists pending access requests", async () => {
    mockFetchOnce(200, { requests: [] });
    const { result } = renderHook(() => usePendingAccessRequests(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("approves or denies an access request", async () => {
    mockFetchOnce(200, { request: { status: "approved" } });
    const { result } = renderHook(() => useDecideAccessRequest(), { wrapper });
    result.current.mutate({ email: "a@example.org", decision: "approve" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/access-requests/a%40example.org/approve", { method: "POST" });
  });

  it("surfaces an error when submission is invalid", async () => {
    mockFetchOnce(422, { error: "INVALID_REQUEST" });
    const { result } = renderHook(() => useSubmitAccessRequest(), { wrapper });
    result.current.mutate({ name: "", email: "", reason: "" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
