export type SourceFormat = "pdf" | "scanned-image" | "text" | "markdown" | "word" | "spreadsheet";

export interface ArchiveDocument {
  id: string;
  title: string;
  section: string;
  date: string;
  sourceFormat: SourceFormat;
  storageObjectPath: string;
  version: number;
  metadataComplete: boolean;
}

export interface OkfRecord {
  id: string;
  archiveDocumentId: string;
  archiveDocumentVersion: number;
  title: string;
  section: string;
  date: string;
  sourceIdentifier: string;
  body: string;
  author: string | null;
  location: string | null;
  entities: string[];
  conversionWarnings: string[];
}

export type CatalogEntryStatus = "current" | "superseded";

export interface CatalogEntry {
  catalogEntryId: string;
  version: number;
  status: CatalogEntryStatus;
  okfRecordId: string;
  archiveDocumentId: string;
  publishedAt: string;
  agentSearchDiscoverable: "pending" | "discoverable";
  embeddingId: string;
  searchableFields: { title: string; section: string; date: string };
}

export type PipelineStage =
  | "imported"
  | "converted"
  | "publishing"
  | "published"
  | "discoverable"
  | "failed";

export interface AttemptRecord {
  attemptedAt: string;
  action: "convert" | "publish";
  outcome: "success" | "failure";
  errorDetail: string | null;
}

export interface PipelineStatus {
  archiveDocumentId: string;
  archiveDocumentVersion: number;
  batchId: string | null;
  stage: PipelineStage;
  lastError: string | null;
  attempts: AttemptRecord[];
}

export interface Batch {
  batchId: string;
  archiveDocumentIds: string[];
  createdBy: string;
  createdAt: string;
}

export type UserRole = "viewer" | "publisher";
export type IdentityProvider = "google" | "wordpress";

export interface User {
  id: string;
  role: UserRole;
  identityProvider: IdentityProvider;
}

export interface Favorite {
  userId: string;
  archiveDocumentId: string;
  favoritedAt: string;
}

export type AccessRequestStatus = "pending" | "approved" | "denied";

export interface AccessRequest {
  email: string;
  name: string;
  affiliation: string | null;
  reason: string;
  status: AccessRequestStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}
