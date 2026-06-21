import type { ArchiveDocument } from "@/lib/types";

export interface MetadataValidation {
  complete: boolean;
  missingFields: string[];
}

const REQUIRED_FIELDS: Array<keyof ArchiveDocument> = ["title", "section", "date"];

export function validateMetadata(archiveDocument: ArchiveDocument): MetadataValidation {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = archiveDocument[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
  return { complete: missingFields.length === 0, missingFields };
}
