export interface SignInProps {
  onSignIn: () => void;
  onGoToRequestAccess: () => void;
}

export function SignIn(props: SignInProps): JSX.Element {
  return (
    <main>
      <h1>Welcome back</h1>
      <p>Sign in to search, ask, and explore the archive.</p>
      <button type="button" onClick={props.onSignIn}>
        Continue with Google
      </button>
      <p>
        Don&apos;t have access yet?{" "}
        <button type="button" onClick={props.onGoToRequestAccess}>
          Request access
        </button>
      </p>
    </main>
  );
}
