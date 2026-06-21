import type { AttemptRecord } from "@/lib/types";

export interface PublicationHistoryProps {
  attempts: AttemptRecord[];
}

export function PublicationHistory(props: PublicationHistoryProps): JSX.Element {
  return (
    <main>
      <h1>Publication History</h1>
      {props.attempts.length === 0 ? (
        <p>No attempts recorded yet.</p>
      ) : (
        <ul aria-label="Publication history">
          {props.attempts.map((attempt) => (
            <li key={`${attempt.attemptedAt}-${attempt.action}`}>
              {`${attempt.attemptedAt} — ${attempt.action} — ${attempt.outcome}`}
              {attempt.errorDetail !== null && <span role="alert">{attempt.errorDetail}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
