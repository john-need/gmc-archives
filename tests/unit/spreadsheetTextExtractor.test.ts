const loadMock = jest.fn();
const eachRowImpl = (callback: (row: { values: unknown[] }) => void) => {
  callback({ values: [undefined, "Name", "Date"] });
  callback({ values: [undefined, "Spring Newsletter", "1978-03-01"] });
};

jest.mock("exceljs", () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    xlsx: { load: loadMock },
    worksheets: [{ eachRow: eachRowImpl }]
  }))
}));

import { extractSpreadsheetText } from "@/lib/conversion/spreadsheetTextExtractor";

describe("extractSpreadsheetText", () => {
  beforeEach(() => {
    loadMock.mockClear();
  });

  it("extracts cell text from an .xlsx workbook", async () => {
    loadMock.mockResolvedValueOnce(undefined);
    const result = await extractSpreadsheetText(Buffer.from("fake xlsx bytes"));
    expect(result).toContain("Spring Newsletter");
    expect(loadMock).toHaveBeenCalled();
  });

  it("falls back to reading the buffer as plain text when xlsx parsing fails (e.g. a .csv file)", async () => {
    loadMock.mockRejectedValueOnce(new Error("not a valid zip"));
    const result = await extractSpreadsheetText(Buffer.from("Name,Date\nSpring Newsletter,1978-03-01"));
    expect(result).toContain("Spring Newsletter");
  });
});
