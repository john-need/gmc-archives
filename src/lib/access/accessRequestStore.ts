import type { AccessRequest } from "@/lib/types";

export interface AccessRequestStore {
  submit(request: { email: string; name: string; affiliation: string | null; reason: string }): Promise<AccessRequest>;
  listPending(): Promise<AccessRequest[]>;
  getByEmail(email: string): Promise<AccessRequest | null>;
  approve(email: string, decidedBy: string): Promise<AccessRequest>;
  deny(email: string, decidedBy: string): Promise<AccessRequest>;
}
