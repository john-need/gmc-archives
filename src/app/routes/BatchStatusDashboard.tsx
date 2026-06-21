import type { PipelineStatus } from "@/lib/types";

export interface BatchStatusDashboardProps {
  batchId: string;
  documents: PipelineStatus[];
}

export function BatchStatusDashboard(props: BatchStatusDashboardProps): JSX.Element {
  return (
    <main>
      <h1>{`Batch ${props.batchId} Status`}</h1>
      <ul aria-label="Batch document status">
        {props.documents.map((status) => (
          <li key={status.archiveDocumentId}>
            {`${status.archiveDocumentId}: ${status.stage}`}
            {status.lastError !== null && <span role="alert">{status.lastError}</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
