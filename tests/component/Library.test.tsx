import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Library } from "@/app/routes/Library";
import type { ArchiveDocument } from "@/lib/types";

expect.extend(toHaveNoViolations);

const documents: ArchiveDocument[] = [
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
    title: "Trail Map 1962",
    section: "Maps",
    date: "1962-01-01",
    sourceFormat: "scanned-image",
    storageObjectPath: "doc-2/v1",
    version: 1,
    metadataComplete: true
  }
];

function renderLibrary(overrides: Partial<Parameters<typeof Library>[0]> = {}) {
  const props = {
    documents,
    favoritedIds: [] as string[],
    onView: jest.fn(),
    onDownload: jest.fn(),
    onToggleFavorite: jest.fn(),
    ...overrides
  };
  render(<Library {...props} />);
  return props;
}

describe("Library", () => {
  it("lists all documents by default", () => {
    renderLibrary();
    expect(screen.getByText("GMC Newsletter Spring 1978")).toBeInTheDocument();
    expect(screen.getByText("Trail Map 1962")).toBeInTheDocument();
  });

  it("narrows results as the user types a search term", async () => {
    renderLibrary();
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox", { name: /search the archive/i }), "Trail");
    expect(screen.queryByText("GMC Newsletter Spring 1978")).not.toBeInTheDocument();
    expect(screen.getByText("Trail Map 1962")).toBeInTheDocument();
  });

  it("filters to a single collection when a chip is selected", async () => {
    renderLibrary();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Maps" }));
    expect(screen.queryByText("GMC Newsletter Spring 1978")).not.toBeInTheDocument();
    expect(screen.getByText("Trail Map 1962")).toBeInTheDocument();
  });

  it("toggles between grid and list layout while preserving the active filter", async () => {
    renderLibrary();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Maps" }));
    await user.click(screen.getByRole("button", { name: /list/i }));
    expect(screen.getByText("Trail Map 1962")).toBeInTheDocument();
    expect(screen.queryByText("GMC Newsletter Spring 1978")).not.toBeInTheDocument();
  });

  it("clicking All resets an active collection filter", async () => {
    renderLibrary();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Maps" }));
    expect(screen.queryByText("GMC Newsletter Spring 1978")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("GMC Newsletter Spring 1978")).toBeInTheDocument();
  });

  it("shows Unfavorite for a document already in favoritedIds", async () => {
    const onToggleFavorite = jest.fn();
    renderLibrary({ favoritedIds: ["doc-1"], onToggleFavorite });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /unfavorite gmc newsletter spring 1978/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith("doc-1");
  });

  it("opens the viewer and requests the original format/content-type on download", async () => {
    const onView = jest.fn();
    const onDownload = jest.fn();
    renderLibrary({ onView, onDownload });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /view gmc newsletter spring 1978/i }));
    expect(onView).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /download gmc newsletter spring 1978/i }));
    expect(onDownload).toHaveBeenCalledWith("doc-1");
  });

  it("shows a no-documents message when nothing matches", async () => {
    renderLibrary();
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox", { name: /search the archive/i }), "nonexistent");
    expect(screen.getByText(/no documents match/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    renderLibrary();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
