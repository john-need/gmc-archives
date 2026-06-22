import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUpload } from "@/app/queries/useUpload";

type Listener = () => void;

class FakeXMLHttpRequest {
  upload = { addEventListener: (_event: string, listener: Listener) => this.progressListeners.push(listener) };
  status = 0;
  responseText = "";
  private progressListeners: Listener[] = [];
  private listeners: Record<string, Listener[]> = {};

  static instances: FakeXMLHttpRequest[] = [];

  constructor() {
    FakeXMLHttpRequest.instances.push(this);
  }

  open(): void {}
  send(): void {}
  setRequestHeader(): void {}

  addEventListener(event: string, listener: Listener): void {
    this.listeners[event] = [...(this.listeners[event] ?? []), listener];
  }

  emitProgress(loaded: number, total: number): void {
    this.progressListeners.forEach((listener) => {
      (listener as unknown as (event: { lengthComputable: boolean; loaded: number; total: number }) => void)({
        lengthComputable: true,
        loaded,
        total
      });
    });
  }

  emitLoad(status: number, responseText: string): void {
    this.status = status;
    this.responseText = responseText;
    this.listeners.load?.forEach((listener) => listener());
  }

  emitError(): void {
    this.listeners.error?.forEach((listener) => listener());
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  FakeXMLHttpRequest.instances = [];
  (global as unknown as { XMLHttpRequest: typeof FakeXMLHttpRequest }).XMLHttpRequest = FakeXMLHttpRequest;
});

describe("useUpload", () => {
  it("tracks upload progress and transitions to indexed on success", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });
    act(() => {
      result.current.uploadFiles([new File(["bytes"], "report.pdf")]);
    });
    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0].status).toBe("uploading");

    const xhr = FakeXMLHttpRequest.instances[0];
    act(() => xhr.emitProgress(50, 100));
    await waitFor(() => expect(result.current.uploads[0].progress).toBe(50));

    act(() => xhr.emitLoad(201, JSON.stringify({ archiveDocumentId: "doc-1" })));
    await waitFor(() => expect(result.current.uploads[0].status).toBe("indexed"));
  });

  it("transitions to failed with the server's error code on a non-2xx response", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });
    act(() => {
      result.current.uploadFiles([new File(["bytes"], "bad.exe")]);
    });
    const xhr = FakeXMLHttpRequest.instances[0];
    act(() => xhr.emitLoad(422, JSON.stringify({ error: "UNSUPPORTED_FORMAT" })));
    await waitFor(() => expect(result.current.uploads[0].status).toBe("failed"));
    expect(result.current.uploads[0].error).toBe("UNSUPPORTED_FORMAT");
  });

  it("falls back to UPLOAD_FAILED when the error response isn't valid JSON", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });
    act(() => {
      result.current.uploadFiles([new File(["bytes"], "bad.exe")]);
    });
    const xhr = FakeXMLHttpRequest.instances[0];
    act(() => xhr.emitLoad(500, "not json"));
    await waitFor(() => expect(result.current.uploads[0].error).toBe("UPLOAD_FAILED"));
  });

  it("transitions to failed with UPLOAD_FAILED on a network error", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });
    act(() => {
      result.current.uploadFiles([new File(["bytes"], "report.pdf")]);
    });
    const xhr = FakeXMLHttpRequest.instances[0];
    act(() => xhr.emitError());
    await waitFor(() => expect(result.current.uploads[0].status).toBe("failed"));
    expect(result.current.uploads[0].error).toBe("UPLOAD_FAILED");
  });

  it("uploads multiple files independently", async () => {
    const { result } = renderHook(() => useUpload(), { wrapper });
    act(() => {
      result.current.uploadFiles([new File(["a"], "a.pdf"), new File(["b"], "b.pdf")]);
    });
    expect(result.current.uploads).toHaveLength(2);
  });
});
