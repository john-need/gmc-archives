# Contract: AccessRequestStore (`src/lib/access`)

Internal library interface backing FR-017–FR-019. The backend
(`src/backend/routes/accessRequests.ts`) is the only caller.

```ts
interface AccessRequestStore {
  submit(request: {
    email: string;
    name: string;
    affiliation: string | null;
    reason: string;
  }): Promise<AccessRequest>; // creates, or updates the existing pending one for that email
  listPending(): Promise<AccessRequest[]>;
  getByEmail(email: string): Promise<AccessRequest | null>;
  approve(email: string, decidedBy: string): Promise<AccessRequest>;
  deny(email: string, decidedBy: string): Promise<AccessRequest>;
}

interface AccessRequest {
  email: string;
  name: string;
  affiliation: string | null;
  reason: string;
  status: "pending" | "approved" | "denied";
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}
```

## Contract test requirements

1. `submit` for a new email creates a `"pending"` request; `submit` again
   for the same email while still `"pending"` updates `name`/`affiliation`/
   `reason`/`submittedAt` on the *same* record rather than creating a
   second one (FR-017) — `listPending()` never contains two entries for
   one email.
2. `approve` transitions the request to `"approved"`, sets `decidedAt`/
   `decidedBy`, and removes it from `listPending()`'s results.
3. `deny` transitions the request to `"denied"`, sets `decidedAt`/
   `decidedBy`, and removes it from `listPending()`'s results.
4. `submit` for an email whose prior request was `"denied"` creates a new
   `"pending"` request (not blocked by the prior denial) — matches
   spec.md's edge case that a denied visitor is routed back to request
   access, not permanently locked out of resubmitting.
5. `getByEmail` for an email with no request at all returns `null`, never
   throws.
