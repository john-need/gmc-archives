import { formatOutput, writeError, writeOutput } from "@/cli/output";

describe("cli output", () => {
  it("formats JSON mode as compact JSON", () => {
    expect(formatOutput({ a: 1 }, "json")).toBe("{\"a\":1}");
  });

  it("formats human mode strings as-is and objects pretty-printed", () => {
    expect(formatOutput("plain text", "human")).toBe("plain text");
    expect(formatOutput({ a: 1 }, "human")).toBe("{\n  \"a\": 1\n}");
  });

  it("writeOutput writes a newline-terminated line to stdout", () => {
    const spy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeOutput({ a: 1 }, "json");
    expect(spy).toHaveBeenCalledWith("{\"a\":1}\n");
    spy.mockRestore();
  });

  it("writeError writes a newline-terminated line to stderr", () => {
    const spy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    writeError("boom");
    expect(spy).toHaveBeenCalledWith("boom\n");
    spy.mockRestore();
  });
});
