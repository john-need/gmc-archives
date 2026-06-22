export interface SignInProps {
  onSignIn: () => void;
  onGoToRequestAccess: () => void;
}

export function SignIn(props: SignInProps): JSX.Element {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background: "radial-gradient(1200px 600px at 70% -10%, #FBEFE6 0%, #F4F0E9 55%)"
      }}
    >
      <div style={{ width: "100%", maxWidth: 430 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 30 }}>
          <img src="/gmc-btv-logo.png" alt="Green Mountain Club" width={52} height={52} style={{ display: "block", objectFit: "contain" }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>GMC · Burlington Historical Archive</span>
        </div>
        <div
          style={{
            background: "#FBF7EC",
            border: "1px solid #EAE2D6",
            borderRadius: 4,
            padding: "34px 32px",
            boxShadow: "0 1px 2px rgba(60,45,30,.04), 0 6px 16px rgba(60,45,30,.08)"
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 25, fontWeight: 700, letterSpacing: "-.02em" }}>Welcome back</h1>
          <p style={{ margin: "0 0 26px", color: "#7A7064", fontSize: 15, lineHeight: 1.5 }}>
            Sign in to search, ask, and explore the Green Mountain Club&apos;s Burlington historical records.
          </p>

          <button
            type="button"
            onClick={props.onSignIn}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 11,
              padding: 13,
              borderRadius: 3,
              border: "1px solid #E3DACD",
              background: "#FBF7EC",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              color: "#2A2520"
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#9A9085"
                d="M21.35 11.1h-9.18v3.83h5.27c-.23 1.34-1.6 3.92-5.27 3.92-3.17 0-5.76-2.63-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.46 3.6 14.55 2.8 12.17 2.8 7.3 2.8 3.35 6.74 3.35 11.6s3.95 8.8 8.82 8.8c5.09 0 8.46-3.58 8.46-8.62 0-.58-.06-1.02-.28-1.68z"
              />
            </svg>
            Continue with Google
          </button>
          <p style={{ margin: "18px 0 0", fontSize: "12.5px", color: "#A79D90", lineHeight: 1.5, textAlign: "center" }}>
            Single sign-on · Your role is set by your workspace admin
          </p>
          <div
            style={{
              marginTop: 20,
              paddingTop: 18,
              borderTop: "1px solid #EFE7DA",
              textAlign: "center",
              fontSize: "13.5px",
              color: "#7A7064"
            }}
          >
            Don&apos;t have access yet?{" "}
            <button
              type="button"
              onClick={props.onGoToRequestAccess}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#4A5E22",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                fontFamily: "inherit"
              }}
            >
              Request access
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
