import { Route, Routes } from "react-router-dom";

function DocumentBrowserPlaceholder(): JSX.Element {
  return <div>Browse</div>;
}

function BatchStatusDashboardPlaceholder(): JSX.Element {
  return <div>Batch Status</div>;
}

function PublicationHistoryPlaceholder(): JSX.Element {
  return <div>History</div>;
}

function CatalogSearchPlaceholder(): JSX.Element {
  return <div>Catalog Search</div>;
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<DocumentBrowserPlaceholder />} />
      <Route path="/batches/:batchId" element={<BatchStatusDashboardPlaceholder />} />
      <Route path="/history" element={<PublicationHistoryPlaceholder />} />
      <Route path="/catalog" element={<CatalogSearchPlaceholder />} />
    </Routes>
  );
}
