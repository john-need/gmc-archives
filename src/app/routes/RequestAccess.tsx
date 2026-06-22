import { useState } from "react";

export interface RequestAccessSubmission {
  name: string;
  email: string;
  affiliation: string;
  reason: string;
}

export interface RequestAccessProps {
  submitted: boolean;
  submittedName?: string;
  onSubmit: (submission: RequestAccessSubmission) => void;
  onBackToSignIn: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestAccess(props: RequestAccessProps): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);

  if (props.submitted) {
    return (
      <main>
        <h1>Request submitted</h1>
        <p>
          Thanks, {props.submittedName ?? "there"} — we&apos;ve received your request. Approval is manual and may
          take several days.
        </p>
        <button type="button" onClick={props.onBackToSignIn}>
          Back to sign in
        </button>
      </main>
    );
  }

  return (
    <main>
      <button type="button" onClick={props.onBackToSignIn}>
        Back to sign in
      </button>
      <h1>Request access</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const isValid = name.trim().length > 0 && EMAIL_PATTERN.test(email.trim()) && reason.trim().length > 0;
          if (!isValid) {
            setShowError(true);
            return;
          }
          setShowError(false);
          props.onSubmit({ name: name.trim(), email: email.trim(), affiliation: affiliation.trim(), reason: reason.trim() });
        }}
      >
        <label htmlFor="request-access-name">Name</label>
        <input id="request-access-name" value={name} onChange={(event) => setName(event.target.value)} />

        <label htmlFor="request-access-email">Email</label>
        <input id="request-access-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

        <label htmlFor="request-access-affiliation">Affiliation (optional)</label>
        <input
          id="request-access-affiliation"
          value={affiliation}
          onChange={(event) => setAffiliation(event.target.value)}
        />

        <label htmlFor="request-access-reason">Reason for request</label>
        <textarea id="request-access-reason" value={reason} onChange={(event) => setReason(event.target.value)} />

        {showError && (
          <p role="alert">Please enter your name, a valid email address, and a reason for your request.</p>
        )}

        <button type="submit">Submit request</button>
      </form>
    </main>
  );
}
