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

const PAGE_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  background: "radial-gradient(1200px 600px at 70% -10%, #FBEFE6 0%, #F4F0E9 55%)"
};

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  background: "#FBF7EC",
  border: "1px solid #EAE2D6",
  borderRadius: 4,
  padding: 32,
  boxShadow: "0 1px 2px rgba(60,45,30,.04), 0 6px 16px rgba(60,45,30,.08)"
};

const LABEL_STYLE: React.CSSProperties = { display: "block", fontSize: "12.5px", fontWeight: 600, color: "#5C544A", marginBottom: 6 };

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E3DACD",
  borderRadius: 3,
  background: "#FFFFFF",
  fontSize: 14,
  color: "#2A2520",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box"
};

export function RequestAccess(props: RequestAccessProps): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);

  if (props.submitted) {
    return (
      <main style={PAGE_STYLE}>
        <div style={{ ...CARD_STYLE, textAlign: "center", padding: "40px 32px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#E8F0E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4E8C4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5L20 7" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>Request submitted</h1>
          <p style={{ margin: "0 0 24px", color: "#7A7064", fontSize: "14.5px", lineHeight: 1.6 }}>
            Thanks, {props.submittedName ?? "there"} — we&apos;ve received your request. Approval is manual and may take
            several days; you&apos;ll hear from GMC Burlington by email.
          </p>
          <button
            type="button"
            onClick={props.onBackToSignIn}
            style={{
              padding: "11px 22px",
              border: "1px solid #E3DACD",
              borderRadius: 3,
              background: "#FBF7EC",
              color: "#2A2520",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        <button
          type="button"
          onClick={props.onBackToSignIn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: 16,
            color: "#7A7064",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to sign in
        </button>
        <h1 style={{ margin: "0 0 10px", fontSize: 23, fontWeight: 700, letterSpacing: "-.02em" }}>Request access</h1>
        <p style={{ margin: "0 0 22px", color: "#7A7064", fontSize: 14, lineHeight: 1.6 }}>
          Access to the archive is free, but requires approval by GMC Burlington. Complete the form below to request
          access. Approval is manual and may take several days.
        </p>
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
          <div style={{ marginBottom: 15 }}>
            <label htmlFor="request-access-name" style={LABEL_STYLE}>
              Name <span style={{ color: "#B4543A" }}>*</span>
            </label>
            <input
              id="request-access-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              style={FIELD_STYLE}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label htmlFor="request-access-email" style={LABEL_STYLE}>
              Email <span style={{ color: "#B4543A" }}>*</span>
            </label>
            <input
              id="request-access-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.org"
              style={FIELD_STYLE}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label htmlFor="request-access-affiliation" style={LABEL_STYLE}>
              Affiliation <span style={{ color: "#A79D90", fontWeight: 500 }}>(optional)</span>
            </label>
            <input
              id="request-access-affiliation"
              value={affiliation}
              onChange={(event) => setAffiliation(event.target.value)}
              placeholder="Organization, section, or institution"
              style={FIELD_STYLE}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="request-access-reason" style={LABEL_STYLE}>
              Reason for request <span style={{ color: "#B4543A" }}>*</span>
            </label>
            <textarea
              id="request-access-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell us how you intend to use the archive"
              style={{ ...FIELD_STYLE, minHeight: 92, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {showError && (
            <p role="alert" style={{ margin: "-6px 0 14px", color: "#B4543A", fontSize: "12.5px", lineHeight: 1.45 }}>
              Please enter your name, a valid email address, and a reason for your request.
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              border: "none",
              borderRadius: 3,
              background: "#4A5E22",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Submit request
          </button>
        </form>
      </div>
    </main>
  );
}
