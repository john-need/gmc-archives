import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DocumentBrowser } from "@/app/routes/DocumentBrowser";
import { documentsSlice } from "@/app/store/documentsSlice";
import type { ArchiveDocument } from "@/lib/types";

expect.extend(toHaveNoViolations);

const fixtures: ArchiveDocument[] = [
  {
    id: "doc-1",
    title: "GMC Newsletter Spring 1978",
    section: "Newsletters",
    date: "1978-03-01",
    sourceFormat: "pdf",
    storageObjectPath: "doc-1/v1",
    version: 1,
    metadataComplete: true
  },
  {
    id: "doc-2",
    title: "Untitled Scan",
    section: "Field Reports",
    date: "1965-01-01",
    sourceFormat: "scanned-image",
    storageObjectPath: "doc-2/v1",
    version: 1,
    metadataComplete: false
  }
];

function renderBrowser(documents: ArchiveDocument[], onConvert: (id: string) => void): void {
  const store = configureStore({ reducer: { documents: documentsSlice.reducer } });
  const queryClient = new QueryClient();
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <DocumentBrowser documents={documents} onSelectDocument={() => undefined} onConvertDocument={onConvert} />
      </QueryClientProvider>
    </Provider>
  );
}

describe("DocumentBrowser", () => {
  it("lists documents and lets the user select then initiate conversion", async () => {
    const onConvert = jest.fn();
    renderBrowser(fixtures, onConvert);
    const user = userEvent.setup();

    expect(screen.getByRole("list", { name: /archive documents/i })).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /convert gmc newsletter spring 1978/i }));
    expect(onConvert).toHaveBeenCalledWith("doc-1");
  });

  it("displays a missing-metadata error when conversion is blocked", () => {
    renderBrowser(fixtures, jest.fn());
    expect(screen.getByText(/missing metadata/i)).toBeInTheDocument();
  });

  it("supports keyboard navigation through the list", async () => {
    renderBrowser(fixtures, jest.fn());
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: /convert gmc newsletter spring 1978/i })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    renderBrowser(fixtures, jest.fn());
    const { container } = { container: document.body };
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
