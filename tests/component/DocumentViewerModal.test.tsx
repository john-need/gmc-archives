import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { DocumentViewerModal } from "@/app/components/DocumentViewerModal";
import type { ArchiveDocument } from "@/lib/types";

expect.extend(toHaveNoViolations);

const fixtureDocument: ArchiveDocument = {
  id: "doc-1",
  title: "GMC Newsletter Spring 1978",
  section: "Newsletters",
  date: "1978-03-01",
  sourceFormat: "pdf",
  storageObjectPath: "doc-1/v1",
  version: 1,
  metadataComplete: true
};

function renderModal(overrides: Partial<Parameters<typeof DocumentViewerModal>[0]> = {}) {
  const props = {
    document: fixtureDocument,
    onClose: jest.fn(),
    onDownload: jest.fn(),
    onToggleFavorite: jest.fn(),
    onAskAboutDocument: jest.fn(),
    isFavorited: false,
    ...overrides
  };
  render(<DocumentViewerModal {...props} />);
  return props;
}

describe("DocumentViewerModal", () => {
  it("renders the document's title, metadata, and actions", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "GMC Newsletter Spring 1978" })).toBeInTheDocument();
    expect(screen.getByText("1978-03-01")).toBeInTheDocument();
  });

  it("shows a 'no longer available' state instead of erroring when the document has been deleted", () => {
    renderModal({ document: null });
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
    expect(screen.queryByText("GMC Newsletter Spring 1978")).not.toBeInTheDocument();
  });

  it("renders nothing while the document is still loading (undefined)", () => {
    const { container } = render(
      <DocumentViewerModal
        document={undefined}
        onClose={jest.fn()}
        onDownload={jest.fn()}
        onToggleFavorite={jest.fn()}
        onAskAboutDocument={jest.fn()}
        isFavorited={false}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onDownload, onToggleFavorite, and onAskAboutDocument with the document id", async () => {
    const onDownload = jest.fn();
    const onToggleFavorite = jest.fn();
    const onAskAboutDocument = jest.fn();
    renderModal({ onDownload, onToggleFavorite, onAskAboutDocument });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download/i }));
    expect(onDownload).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /favorite/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith("doc-1");
    await user.click(screen.getByRole("button", { name: /ask about this document/i }));
    expect(onAskAboutDocument).toHaveBeenCalledWith("doc-1");
  });

  it("has no accessibility violations", async () => {
    renderModal();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations in the 'no longer available' state", async () => {
    renderModal({ document: null });
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("traps focus: Tab from the last button wraps to the first", async () => {
    renderModal();
    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button");
    buttons[buttons.length - 1].focus();
    await user.tab();
    expect(buttons[0]).toHaveFocus();
  });

  it("traps focus: Shift+Tab from the first button wraps to the last", async () => {
    renderModal();
    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    await user.tab({ shift: true });
    expect(buttons[buttons.length - 1]).toHaveFocus();
  });

  it("ignores non-Tab, non-Escape keys", async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    await user.keyboard("a");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("returns focus to the trigger element on close", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = render(
      <DocumentViewerModal
        document={fixtureDocument}
        onClose={jest.fn()}
        onDownload={jest.fn()}
        onToggleFavorite={jest.fn()}
        onAskAboutDocument={jest.fn()}
        isFavorited={false}
      />
    );
    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
