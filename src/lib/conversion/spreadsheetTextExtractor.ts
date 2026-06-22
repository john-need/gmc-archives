import { Workbook } from "exceljs";

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const lines: string[] = [];
  for (const worksheet of workbook.worksheets) {
    worksheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values : [];
      const cells = values.slice(1).map((value: unknown) => String(value ?? ""));
      lines.push(cells.join(" "));
    });
  }
  return lines.join("\n");
}

// ponytail: .csv buffers aren't valid OOXML zips, so xlsx.load throws on them —
// caught here and treated as plain text rather than threading the original
// filename through the whole conversion pipeline just to disambiguate.
export async function extractSpreadsheetText(buffer: Buffer): Promise<string> {
  try {
    return await extractXlsxText(buffer);
  } catch {
    return buffer.toString("utf-8");
  }
}
