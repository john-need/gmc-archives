import { formatSourceFormatLabel } from "@/lib/catalog/formatSourceFormatLabel";

describe("formatSourceFormatLabel", () => {
  it("maps each known source format to a short uppercase label", () => {
    expect(formatSourceFormatLabel("pdf")).toBe("PDF");
    expect(formatSourceFormatLabel("scanned-image")).toBe("SCAN");
    expect(formatSourceFormatLabel("text")).toBe("TXT");
    expect(formatSourceFormatLabel("markdown")).toBe("MD");
    expect(formatSourceFormatLabel("word")).toBe("DOC");
    expect(formatSourceFormatLabel("spreadsheet")).toBe("XLS");
  });
});
