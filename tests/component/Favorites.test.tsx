import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Favorites } from "@/app/routes/Favorites";
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
  }
];

describe("Favorites", () => {
  it("lists favorited documents with view/download/unfavorite actions", async () => {
    const onView = jest.fn();
    const onDownload = jest.fn();
    const onUnfavorite = jest.fn();
    render(
      <Favorites documents={documents} onView={onView} onDownload={onDownload} onUnfavorite={onUnfavorite} onGoToLibrary={jest.fn()} />
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /view gmc newsletter spring 1978/i }));
    expect(onView).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /download gmc newsletter spring 1978/i }));
    expect(onDownload).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /unfavorite gmc newsletter spring 1978/i }));
    expect(onUnfavorite).toHaveBeenCalledWith("doc-1");
  });

  it("shows an empty state with a link back to Library when there are no favorites", async () => {
    const onGoToLibrary = jest.fn();
    render(<Favorites documents={[]} onView={jest.fn()} onDownload={jest.fn()} onUnfavorite={jest.fn()} onGoToLibrary={onGoToLibrary} />);
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /browse the library/i }));
    expect(onGoToLibrary).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    render(<Favorites documents={documents} onView={jest.fn()} onDownload={jest.fn()} onUnfavorite={jest.fn()} onGoToLibrary={jest.fn()} />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
