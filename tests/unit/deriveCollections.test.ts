import { deriveCollections } from "@/lib/catalog/deriveCollections";
import type { ArchiveDocument } from "@/lib/types";

function doc(section: string): ArchiveDocument {
  return {
    id: section,
    title: section,
    section,
    date: "1978-03-01",
    sourceFormat: "pdf",
    storageObjectPath: `${section}/v1`,
    version: 1,
    metadataComplete: true
  };
}

describe("deriveCollections", () => {
  it("returns distinct, sorted section names", () => {
    const documents = [doc("Newsletters"), doc("Maps"), doc("Newsletters")];
    expect(deriveCollections(documents)).toEqual(["Maps", "Newsletters"]);
  });

  it("returns an empty array for no documents", () => {
    expect(deriveCollections([])).toEqual([]);
  });
});
