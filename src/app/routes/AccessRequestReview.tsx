import type { AccessRequest } from "@/lib/types";

export interface AccessRequestReviewProps {
  requests: AccessRequest[];
  onApprove: (email: string) => void;
  onDeny: (email: string) => void;
}

export function AccessRequestReview(props: AccessRequestReviewProps): JSX.Element {
  return (
    <main>
      <h1>Access Requests</h1>
      {props.requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul aria-label="Pending access requests">
          {props.requests.map((request) => (
            <li key={request.email}>
              <span>{request.name}</span>
              <span>{request.email}</span>
              <span>{request.reason}</span>
              <button type="button" onClick={() => props.onApprove(request.email)}>
                {`Approve ${request.name}`}
              </button>
              <button type="button" onClick={() => props.onDeny(request.email)}>
                {`Deny ${request.name}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
