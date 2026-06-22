import type { AccessRequestStore } from "@/lib/access/accessRequestStore";
import type { AccessRequest } from "@/lib/types";

export function createFakeAccessRequestStore(): AccessRequestStore {
  const requestsByEmail = new Map<string, AccessRequest>();

  return {
    async submit(request) {
      const existing = requestsByEmail.get(request.email);
      const updated: AccessRequest =
        existing !== undefined && existing.status === "pending"
          ? { ...existing, name: request.name, affiliation: request.affiliation, reason: request.reason, submittedAt: new Date().toISOString() }
          : {
              email: request.email,
              name: request.name,
              affiliation: request.affiliation,
              reason: request.reason,
              status: "pending",
              submittedAt: new Date().toISOString(),
              decidedAt: null,
              decidedBy: null
            };
      requestsByEmail.set(request.email, updated);
      return updated;
    },
    async listPending() {
      return Array.from(requestsByEmail.values()).filter((request) => request.status === "pending");
    },
    async getByEmail(email) {
      return requestsByEmail.get(email) ?? null;
    },
    async approve(email, decidedBy) {
      const existing = requestsByEmail.get(email);
      if (existing === undefined) {
        throw new Error("REQUEST_NOT_FOUND");
      }
      const updated: AccessRequest = { ...existing, status: "approved", decidedAt: new Date().toISOString(), decidedBy };
      requestsByEmail.set(email, updated);
      return updated;
    },
    async deny(email, decidedBy) {
      const existing = requestsByEmail.get(email);
      if (existing === undefined) {
        throw new Error("REQUEST_NOT_FOUND");
      }
      const updated: AccessRequest = { ...existing, status: "denied", decidedAt: new Date().toISOString(), decidedBy };
      requestsByEmail.set(email, updated);
      return updated;
    }
  };
}
