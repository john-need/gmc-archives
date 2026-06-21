import { DiscoverabilityBadge } from "@/app/components/DiscoverabilityBadge";
import { useDiscoverability } from "@/app/queries/useDiscoverability";
import type { PipelineStatus } from "@/lib/types";

export interface BatchStatusDashboardProps {
  batchId: string;
  documents: PipelineStatus[];
  onPublish?: (archiveDocumentId: string) => void;
  onRetry?: (archiveDocumentId: string) => void;
}

function PublishedRowDiscoverability(props: { archiveDocumentId: string }): JSX.Element | null {
  const { data: status } = useDiscoverability(props.archiveDocumentId);
  if (status === undefined) {
    return null;
  }
  return <DiscoverabilityBadge status={status} />;
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
            {status.stage === "published" && <PublishedRowDiscoverability archiveDocumentId={status.archiveDocumentId} />}
            {status.stage === "converted" && props.onPublish !== undefined && (
              <button type="button" onClick={() => props.onPublish?.(status.archiveDocumentId)}>
                {`Publish ${status.archiveDocumentId}`}
              </button>
            )}
            {status.stage === "failed" && props.onRetry !== undefined && (
              <button type="button" onClick={() => props.onRetry?.(status.archiveDocumentId)}>
                {`Retry ${status.archiveDocumentId}`}
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
