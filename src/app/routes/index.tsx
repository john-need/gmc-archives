import { useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { DocumentBrowser } from "@/app/routes/DocumentBrowser";
import { BatchStatusDashboard } from "@/app/routes/BatchStatusDashboard";
import { PublicationHistory } from "@/app/routes/PublicationHistory";
import { CatalogSearch } from "@/app/routes/CatalogSearch";
import { useConvertDocument, useDocuments } from "@/app/queries/useDocuments";
import { useBatchStatus } from "@/app/queries/useBatches";
import { usePublishDocument, useRetryOperation } from "@/app/queries/usePublish";
import { useCatalogSearch, useDownloadDocument } from "@/app/queries/useCatalog";
import { useHistory } from "@/app/queries/useHistory";
import { documentSelected } from "@/app/store/documentsSlice";

function DocumentBrowserContainer(): JSX.Element {
  const { data } = useDocuments();
  const convertDocument = useConvertDocument();
  const dispatch = useDispatch();
  return (
    <DocumentBrowser
      documents={data?.documents ?? []}
      onSelectDocument={(documentId) => dispatch(documentSelected(documentId))}
      onConvertDocument={(documentId) => convertDocument.mutate(documentId)}
    />
  );
}

function BatchStatusDashboardContainer(): JSX.Element {
  const { batchId } = useParams<{ batchId: string }>();
  const { data } = useBatchStatus(batchId ?? "");
  const publishDocument = usePublishDocument();
  const retryOperation = useRetryOperation();
  return (
    <BatchStatusDashboard
      batchId={batchId ?? ""}
      documents={data?.documents ?? []}
      onPublish={(archiveDocumentId) => publishDocument.mutate(archiveDocumentId)}
      onRetry={(archiveDocumentId) => retryOperation.mutate(archiveDocumentId)}
    />
  );
}

function PublicationHistoryContainer(): JSX.Element {
  const { data } = useHistory();
  return <PublicationHistory attempts={data ?? []} />;
}

function CatalogSearchContainer(): JSX.Element {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | undefined>(undefined);
  const { data } = useCatalogSearch({ q: query, section });
  const downloadDocument = useDownloadDocument();
  return (
    <CatalogSearch
      results={data?.results ?? []}
      onSearch={setQuery}
      onSectionFilterChange={(value) => setSection(value === "" ? undefined : value)}
      onDownload={(archiveDocumentId) => downloadDocument.mutate(archiveDocumentId)}
    />
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<DocumentBrowserContainer />} />
      <Route path="/batches/:batchId" element={<BatchStatusDashboardContainer />} />
      <Route path="/history" element={<PublicationHistoryContainer />} />
      <Route path="/catalog" element={<CatalogSearchContainer />} />
    </Routes>
  );
}
