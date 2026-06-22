import { inferSourceFormatFromFilename } from "@/lib/conversion/inferSourceFormatFromFilename";

describe("inferSourceFormatFromFilename", () => {
  it.each([
    ["report.pdf", "pdf"],
    ["scan.png", "scanned-image"],
    ["photo.jpg", "scanned-image"],
    ["photo.jpeg", "scanned-image"],
    ["scan.tiff", "scanned-image"],
    ["notes.txt", "text"],
    ["notes.md", "markdown"],
    ["letter.doc", "word"],
    ["letter.docx", "word"],
    ["data.xls", "spreadsheet"],
    ["data.xlsx", "spreadsheet"],
    ["data.csv", "spreadsheet"]
  ] as const)("infers %s as %s", (filename, expected) => {
    expect(inferSourceFormatFromFilename(filename)).toBe(expected);
  });

  it("returns null for an unrecognized extension", () => {
    expect(inferSourceFormatFromFilename("archive.exe")).toBeNull();
  });

  it("returns null for a filename with no extension", () => {
    expect(inferSourceFormatFromFilename("README")).toBeNull();
  });
});
