const readFileMock = jest.fn();
jest.mock("node:fs/promises", () => ({ readFile: readFileMock }));

import { runAsk } from "@/cli/commands/ask";
import { runRequestAccess, runReviewRequests } from "@/cli/commands/access";
import { runFavorite, runUnfavorite } from "@/cli/commands/favorite";
import { runUpload } from "@/cli/commands/upload";

function mockFetchOnce(status: number, body: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  jest.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  jest.restoreAllMocks();
  process.exitCode = undefined;
});

describe("runAsk", () => {
  it("writes the answer on success", async () => {
    mockFetchOnce(200, { answer: "It was 1930.", sources: [] });
    await runAsk("When?", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("1930"));
  });

  it("writes to stderr on failure", async () => {
    mockFetchOnce(502, { error: "ASK_FAILED" });
    await runAsk("When?", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("ASK_FAILED"));
    expect(process.exitCode).toBe(1);
  });
});

describe("runFavorite / runUnfavorite", () => {
  it("favorites a document", async () => {
    mockFetchOnce(200, { favorited: true });
    await runFavorite("doc-1", "json");
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/favorites/doc-1"), { method: "POST" });
  });

  it("unfavorites a document", async () => {
    mockFetchOnce(200, { favorited: false });
    await runUnfavorite("doc-1", "json");
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/favorites/doc-1"), { method: "DELETE" });
  });

  it("writes to stderr on failure", async () => {
    mockFetchOnce(404, { error: "DOCUMENT_NOT_FOUND" });
    await runFavorite("doc-1", "json");
    expect(process.stderr.write).toHaveBeenCalled();
  });
});

describe("runRequestAccess / runReviewRequests", () => {
  it("submits an access request", async () => {
    mockFetchOnce(200, { status: "pending" });
    await runRequestAccess({ name: "A", email: "a@example.org", reason: "research" }, "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("pending"));
  });

  it("writes to stderr when the request is invalid", async () => {
    mockFetchOnce(422, { error: "INVALID_REQUEST" });
    await runRequestAccess({ name: "", email: "", reason: "" }, "json");
    expect(process.stderr.write).toHaveBeenCalled();
  });

  it("lists pending requests", async () => {
    mockFetchOnce(200, { requests: [] });
    await runReviewRequests("json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("requests"));
  });

  it("writes to stderr when listing fails", async () => {
    mockFetchOnce(403, { error: "FORBIDDEN" });
    await runReviewRequests("json");
    expect(process.stderr.write).toHaveBeenCalled();
  });
});

describe("runUpload", () => {
  it("uploads a file and writes the result", async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from("file bytes"));
    mockFetchOnce(201, { archiveDocumentId: "doc-1" });
    await runUpload("/tmp/report.pdf", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
  });

  it("writes to stderr when the upload fails", async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from("file bytes"));
    mockFetchOnce(422, { error: "UNSUPPORTED_FORMAT" });
    await runUpload("/tmp/bad.exe", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("UNSUPPORTED_FORMAT"));
  });

  it("writes to stderr when the file cannot be read", async () => {
    readFileMock.mockRejectedValueOnce(new Error("ENOENT"));
    await runUpload("/tmp/missing.pdf", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("ENOENT"));
  });
});
