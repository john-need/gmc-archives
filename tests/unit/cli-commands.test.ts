import { runBatchConvert, runConvert } from "@/cli/commands/convert";
import { runBatchPublish, runPublish } from "@/cli/commands/publish";
import { runDownload, runSearch } from "@/cli/commands/search";
import { runStatus } from "@/cli/commands/status";

const writeFileMock = jest.fn().mockResolvedValue(undefined);
jest.mock("node:fs/promises", () => ({ writeFile: writeFileMock }));

function mockFetchOnce(status: number, body: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    arrayBuffer: async () => Buffer.from("file-bytes")
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

describe("CLI commands", () => {
  it("runConvert writes the okfRecord on success", async () => {
    mockFetchOnce(200, { okfRecord: { id: "okf-1" } });
    await runConvert("doc-1", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("okf-1"));
  });

  it("runConvert writes to stderr and sets exitCode on failure", async () => {
    mockFetchOnce(422, { error: "INCOMPLETE_METADATA" });
    await runConvert("doc-1", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("INCOMPLETE_METADATA"));
    expect(process.exitCode).toBe(1);
  });

  it("runBatchConvert posts archiveDocumentIds and writes the batchId", async () => {
    mockFetchOnce(201, { batchId: "batch-1" });
    await runBatchConvert(["doc-1", "doc-2"], "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("batch-1"));
  });

  it("runBatchConvert writes to stderr on failure", async () => {
    mockFetchOnce(422, { error: "BATCH_TOO_LARGE" });
    await runBatchConvert(["doc-1"], "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("BATCH_TOO_LARGE"));
  });

  it("runPublish writes the catalogEntry on success", async () => {
    mockFetchOnce(200, { catalogEntry: { catalogEntryId: "entry-1" } });
    await runPublish("doc-1", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("entry-1"));
  });

  it("runBatchPublish publishes each document id in turn", async () => {
    mockFetchOnce(200, { catalogEntry: { catalogEntryId: "entry-1" } });
    mockFetchOnce(200, { catalogEntry: { catalogEntryId: "entry-2" } });
    await runBatchPublish(["doc-1", "doc-2"], "json");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("runSearch writes the results on success", async () => {
    mockFetchOnce(200, { results: [] });
    await runSearch("trail reports", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("results"));
  });

  it("runSearch writes to stderr on failure", async () => {
    mockFetchOnce(500, { error: "INTERNAL_ERROR" });
    await runSearch("trail reports", "json");
    expect(process.stderr.write).toHaveBeenCalled();
  });

  it("runDownload writes the file to the given path", async () => {
    mockFetchOnce(200, {});
    await runDownload("doc-1", "/tmp/out.bin");
    expect(writeFileMock).toHaveBeenCalledWith("/tmp/out.bin", Buffer.from("file-bytes"));
  });

  it("runDownload writes to stderr on failure", async () => {
    mockFetchOnce(404, {});
    await runDownload("doc-1", "/tmp/out.bin");
    expect(process.stderr.write).toHaveBeenCalled();
  });

  it("runStatus writes the discoverability status on success", async () => {
    mockFetchOnce(200, { status: "pending" });
    await runStatus("doc-1", "json");
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining("pending"));
  });

  it("runStatus falls back to a generic message when the response has no error field", async () => {
    mockFetchOnce(500, {});
    await runStatus("doc-1", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("Status check failed with 500"));
  });

  it("runConvert stringifies a non-Error rejection", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("network down");
    await runConvert("doc-1", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("network down"));
  });

  it("runPublish falls back to a generic message when the response has no error field", async () => {
    mockFetchOnce(500, {});
    await runPublish("doc-1", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("Request to"));
  });

  it("runSearch stringifies a non-Error rejection", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("network down");
    await runSearch("trail", "json");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("network down"));
  });

  it("runDownload falls back to a generic message when the download fails without a body", async () => {
    mockFetchOnce(500, {});
    await runDownload("doc-1", "/tmp/out.bin");
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining("Download failed with 500"));
  });
});
