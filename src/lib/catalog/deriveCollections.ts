import { map, pipe, sortBy, uniq } from "ramda";
import type { ArchiveDocument } from "@/lib/types";

export function deriveCollections(documents: ArchiveDocument[]): string[] {
  return pipe(map((doc: ArchiveDocument) => doc.section), uniq, sortBy((section: string) => section))(documents);
}
