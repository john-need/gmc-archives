import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ToastProvider, useToast } from "@/app/components/Toast";

expect.extend(toHaveNoViolations);

function TriggerButton({ message }: { message: string }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message)}>
      Trigger
    </button>
  );
}

describe("Toast", () => {
  it("shows a message announced via role=status when triggered", async () => {
    render(
      <ToastProvider>
        <TriggerButton message="Added to favorites" />
      </ToastProvider>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /trigger/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Added to favorites");
  });

  it("auto-dismisses the message after a delay", async () => {
    render(
      <ToastProvider>
        <TriggerButton message="Added to favorites" />
      </ToastProvider>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /trigger/i }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 3000 });
  });

  it("throws a clear error when useToast is used outside a ToastProvider", () => {
    function Lonely() {
      useToast();
      return null;
    }
    expect(() => render(<Lonely />)).toThrow(/ToastProvider/);
  });

  it("has no accessibility violations", async () => {
    render(
      <ToastProvider>
        <TriggerButton message="Added to favorites" />
      </ToastProvider>
    );
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
