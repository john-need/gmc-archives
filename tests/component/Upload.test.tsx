import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Upload } from "@/app/routes/Upload";
import type { UploadEntry } from "@/app/routes/Upload";

expect.extend(toHaveNoViolations);

function renderUpload(overrides: Partial<Parameters<typeof Upload>[0]> = {}) {
  const props = {
    isPermitted: true,
    uploads: [] as UploadEntry[],
    onFilesSelected: jest.fn(),
    ...overrides
  };
  render(<Upload {...props} />);
  return props;
}

describe("Upload", () => {
  it("renders nothing for a user without upload permission", () => {
    const { container } = render(<Upload isPermitted={false} uploads={[]} onFilesSelected={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("invokes onFilesSelected when a file is dropped", () => {
    const onFilesSelected = jest.fn();
    renderUpload({ onFilesSelected });
    const dropZone = screen.getByText(/drop files here/i).closest("div")!;
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    const dataTransfer = { files: [file] };
    dropZone.dispatchEvent(
      Object.assign(new Event("drop", { bubbles: true }), { dataTransfer })
    );
    expect(onFilesSelected).toHaveBeenCalled();
  });

  it("toggles the drag-active indicator on dragOver/dragLeave", () => {
    renderUpload();
    const dropZone = screen.getByText(/drop files here/i).closest("div")!;
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    expect(dropZone).toHaveAttribute("data-drag-active", "true");
    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });
    expect(dropZone).toHaveAttribute("data-drag-active", "false");
  });

  it("invokes onFilesSelected when files are chosen via the hidden file input", async () => {
    const onFilesSelected = jest.fn();
    renderUpload({ onFilesSelected });
    const user = userEvent.setup();
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/choose files to upload/i);
    await user.upload(input, file);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("shows per-file progress through to indexed", () => {
    renderUpload({
      uploads: [{ id: "u1", name: "report.pdf", progress: 100, status: "indexed" }]
    });
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Indexed · added to catalog")).toBeInTheDocument();
  });

  it("shows a rejection message for an unsupported format or oversized file", () => {
    renderUpload({
      uploads: [
        { id: "u1", name: "program.exe", progress: 0, status: "failed", error: "UNSUPPORTED_FORMAT" },
        { id: "u2", name: "big.pdf", progress: 0, status: "failed", error: "FILE_TOO_LARGE" }
      ]
    });
    expect(screen.getByText(/unsupported format/i)).toBeInTheDocument();
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    renderUpload({ uploads: [{ id: "u1", name: "report.pdf", progress: 50, status: "uploading" }] });
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
