import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BatchStatusDashboard } from "@/app/routes/BatchStatusDashboard";
import type { PipelineStatus } from "@/lib/types";

expect.extend(toHaveNoViolations);

const fixtures: PipelineStatus[] = [
  { archiveDocumentId: "doc-1", archiveDocumentVersion: 1, batchId: "batch-1", stage: "converted", lastError: null, attempts: [] },
  { archiveDocumentId: "doc-2", archiveDocumentVersion: 1, batchId: "batch-1", stage: "failed", lastError: "boom", attempts: [] }
];

function renderDashboard(onPublish: jest.Mock, onRetry: jest.Mock) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <BatchStatusDashboard batchId="batch-1" documents={fixtures} onPublish={onPublish} onRetry={onRetry} />
    </QueryClientProvider>
  );
}

describe("BatchStatusDashboard", () => {
  it("shows independent per-document status and surfaces errors", () => {
    renderDashboard(jest.fn(), jest.fn());
    expect(screen.getByText(/doc-1: converted/i)).toBeInTheDocument();
    expect(screen.getByText(/doc-2: failed/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });

  it("lets the user publish a converted document and retry a failed one", async () => {
    const onPublish = jest.fn();
    const onRetry = jest.fn();
    renderDashboard(onPublish, onRetry);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /publish doc-1/i }));
    expect(onPublish).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /retry doc-2/i }));
    expect(onRetry).toHaveBeenCalledWith("doc-2");
  });

  it("has no accessibility violations", async () => {
    renderDashboard(jest.fn(), jest.fn());
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
