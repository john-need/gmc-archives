import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useConvertDocument, useDocuments } from "@/app/queries/useDocuments";
import { useBatchStatus } from "@/app/queries/useBatches";
import { usePublishDocument, useRetryOperation } from "@/app/queries/usePublish";
import { useCatalogSearch, useDownloadDocument } from "@/app/queries/useCatalog";
import { useHistory } from "@/app/queries/useHistory";
import { useDiscoverability } from "@/app/queries/useDiscoverability";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function mockFetchOnce(status: number, body: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    blob: async () => new Blob(["bytes"])
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("useDocuments / useConvertDocument", () => {
  it("fetches documents", async () => {
    mockFetchOnce(200, { documents: [{ id: "doc-1" }] });
    const { result } = renderHook(() => useDocuments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.documents).toHaveLength(1);
  });

  it("filters by section and q", async () => {
    mockFetchOnce(200, { documents: [] });
    const { result } = renderHook(() => useDocuments({ section: "Newsletters", q: "spring" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("section=Newsletters"), undefined);
  });

  it("converts a document and surfaces an error on failure", async () => {
    mockFetchOnce(422, { error: "INCOMPLETE_METADATA" });
    const { result } = renderHook(() => useConvertDocument(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useBatchStatus", () => {
  it("fetches batch status", async () => {
    mockFetchOnce(200, { batchId: "batch-1", documents: [] });
    const { result } = renderHook(() => useBatchStatus("batch-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.batchId).toBe("batch-1");
  });

  it("surfaces an error when the batch fetch fails", async () => {
    mockFetchOnce(404, { error: "BATCH_NOT_FOUND" });
    const { result } = renderHook(() => useBatchStatus("batch-1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("usePublishDocument / useRetryOperation", () => {
  it("publishes a document", async () => {
    mockFetchOnce(200, { catalogEntry: { catalogEntryId: "entry-1" } });
    const { result } = renderHook(() => usePublishDocument(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("retries a failed operation", async () => {
    mockFetchOnce(200, { pipelineStatus: { stage: "converted" } });
    const { result } = renderHook(() => useRetryOperation(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("surfaces an error when retry fails", async () => {
    mockFetchOnce(404, { error: "NOTHING_TO_RETRY" });
    const { result } = renderHook(() => useRetryOperation(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("surfaces an error when the publish request fails", async () => {
    mockFetchOnce(409, { error: "ALREADY_PUBLISHED" });
    const { result } = renderHook(() => usePublishDocument(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCatalogSearch / useDownloadDocument", () => {
  it("searches the catalog once a query is present", async () => {
    mockFetchOnce(200, { results: [] });
    const { result } = renderHook(() => useCatalogSearch({ q: "trail" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("does not search when the query is empty", () => {
    const { result } = renderHook(() => useCatalogSearch({ q: "" }), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("includes optional title/section/date filters in the query string", async () => {
    mockFetchOnce(200, { results: [] });
    const { result } = renderHook(
      () => useCatalogSearch({ q: "trail", title: "Trail", section: "Field Reports", date: "1978-03-01" }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("title=Trail"));
  });

  it("surfaces an error when the search request fails", async () => {
    mockFetchOnce(500, { error: "INTERNAL_ERROR" });
    const { result } = renderHook(() => useCatalogSearch({ q: "trail" }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("downloads a document", async () => {
    mockFetchOnce(200, {});
    const { result } = renderHook(() => useDownloadDocument(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("surfaces an error when download fails", async () => {
    mockFetchOnce(404, {});
    const { result } = renderHook(() => useDownloadDocument(), { wrapper });
    result.current.mutate("doc-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useHistory", () => {
  it("fetches history filtered by archiveDocumentId and batchId", async () => {
    mockFetchOnce(200, { attempts: [] });
    const { result } = renderHook(() => useHistory({ archiveDocumentId: "doc-1", batchId: "batch-1" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("archiveDocumentId=doc-1"));
  });

  it("fetches unfiltered history when no params are given", async () => {
    mockFetchOnce(200, { attempts: [] });
    const { result } = renderHook(() => useHistory(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/history");
  });

  it("surfaces an error when the history fetch fails", async () => {
    mockFetchOnce(500, {});
    const { result } = renderHook(() => useHistory(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDiscoverability", () => {
  it("fetches discoverability status", async () => {
    mockFetchOnce(200, { status: "discoverable" });
    const { result } = renderHook(() => useDiscoverability("doc-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("discoverable");
  });

  it("surfaces an error when the discoverability fetch fails", async () => {
    mockFetchOnce(404, {});
    const { result } = renderHook(() => useDiscoverability("doc-1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
