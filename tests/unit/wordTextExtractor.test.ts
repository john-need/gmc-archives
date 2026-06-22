const extractRawTextMock = jest.fn();
jest.mock("mammoth", () => ({ extractRawText: extractRawTextMock }));

import { extractWordText } from "@/lib/conversion/wordTextExtractor";

describe("extractWordText", () => {
  it("returns the extracted plain text from a .docx buffer", async () => {
    extractRawTextMock.mockResolvedValueOnce({ value: "Hello from Word" });
    const result = await extractWordText(Buffer.from("fake docx bytes"));
    expect(result).toBe("Hello from Word");
    expect(extractRawTextMock).toHaveBeenCalledWith({ buffer: Buffer.from("fake docx bytes") });
  });

  it("returns an empty string when mammoth finds no text", async () => {
    extractRawTextMock.mockResolvedValueOnce({ value: "" });
    const result = await extractWordText(Buffer.from("empty"));
    expect(result).toBe("");
  });
});
