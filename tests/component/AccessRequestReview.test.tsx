import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { AccessRequestReview } from "@/app/routes/AccessRequestReview";
import type { AccessRequest } from "@/lib/types";

expect.extend(toHaveNoViolations);

const requests: AccessRequest[] = [
  {
    email: "a@example.org",
    name: "A One",
    affiliation: "GMC",
    reason: "Local history research",
    status: "pending",
    submittedAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null
  }
];

describe("AccessRequestReview", () => {
  it("lists pending requests and lets an Editor approve or deny", async () => {
    const onApprove = jest.fn();
    const onDeny = jest.fn();
    render(<AccessRequestReview requests={requests} onApprove={onApprove} onDeny={onDeny} />);
    const user = userEvent.setup();
    expect(screen.getByText("A One")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /approve a one/i }));
    expect(onApprove).toHaveBeenCalledWith("a@example.org");
    await user.click(screen.getByRole("button", { name: /deny a one/i }));
    expect(onDeny).toHaveBeenCalledWith("a@example.org");
  });

  it("shows an empty state when there are no pending requests", () => {
    render(<AccessRequestReview requests={[]} onApprove={jest.fn()} onDeny={jest.fn()} />);
    expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    render(<AccessRequestReview requests={requests} onApprove={jest.fn()} onDeny={jest.fn()} />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
