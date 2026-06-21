export const MAX_BATCH_SIZE = 50;

export type BatchSizeResult =
  | { valid: true }
  | { valid: false; error: "BATCH_TOO_LARGE"; max: number };

export function validateBatchSize(archiveDocumentIds: string[]): BatchSizeResult {
  if (archiveDocumentIds.length > MAX_BATCH_SIZE) {
    return { valid: false, error: "BATCH_TOO_LARGE", max: MAX_BATCH_SIZE };
  }
  return { valid: true };
}
