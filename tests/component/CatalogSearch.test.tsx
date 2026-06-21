import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { CatalogSearch } from "@/app/routes/CatalogSearch";
import type { CatalogEntry } from "@/lib/types";

expect.extend(toHaveNoViolations);

const fixtures: CatalogEntry[] = [
  {
    catalogEntryId: "entry-1",
    version: 1,
    status: "current",
    okfRecordId: "okf-1",
    archiveDocumentId: "doc-1",
    publishedAt: new Date().toISOString(),
    agentSearchDiscoverable: "discoverable",
    embeddingId: "embedding-1",
    searchableFields: { title: "Trail Maintenance Report", section: "Field Reports", date: "1978-03-01" }
  }
];

describe("CatalogSearch", () => {
  it("lets the user enter a query and shows results", async () => {
    const onSearch = jest.fn();
    render(
      <CatalogSearch results={fixtures} onSearch={onSearch} onDownload={jest.fn()} onSectionFilterChange={jest.fn()} />
    );
    const user = userEvent.setup();

    await user.type(screen.getByRole("searchbox", { name: /catalog search/i }), "trail");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith("trail");
    expect(screen.getByText("Trail Maintenance Report")).toBeInTheDocument();
  });

  it("shows an empty state rather than an error when there are no results", () => {
    render(<CatalogSearch results={[]} onSearch={jest.fn()} onDownload={jest.fn()} onSectionFilterChange={jest.fn()} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("lets the user download a result", async () => {
    const onDownload = jest.fn();
    render(
      <CatalogSearch results={fixtures} onSearch={jest.fn()} onDownload={onDownload} onSectionFilterChange={jest.fn()} />
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download trail maintenance report/i }));
    expect(onDownload).toHaveBeenCalledWith("doc-1");
  });

  it("has keyboard-operable search and filter controls with accessible names", () => {
    render(
      <CatalogSearch results={fixtures} onSearch={jest.fn()} onDownload={jest.fn()} onSectionFilterChange={jest.fn()} />
    );
    expect(screen.getByRole("searchbox", { name: /catalog search/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /section/i })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    render(
      <CatalogSearch results={fixtures} onSearch={jest.fn()} onDownload={jest.fn()} onSectionFilterChange={jest.fn()} />
    );
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
