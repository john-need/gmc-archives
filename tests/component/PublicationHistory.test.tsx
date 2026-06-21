import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { PublicationHistory } from "@/app/routes/PublicationHistory";
import type { AttemptRecord } from "@/lib/types";

expect.extend(toHaveNoViolations);

const fixtures: AttemptRecord[] = [
  { attemptedAt: "2026-01-01T00:00:00Z", action: "convert", outcome: "success", errorDetail: null },
  { attemptedAt: "2026-01-02T00:00:00Z", action: "publish", outcome: "failure", errorDetail: "catalog unavailable" }
];

describe("PublicationHistory", () => {
  it("lists attempts and surfaces error details", () => {
    render(<PublicationHistory attempts={fixtures} />);
    expect(screen.getByText(/convert — success/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("catalog unavailable");
  });

  it("shows an empty state when there are no attempts", () => {
    render(<PublicationHistory attempts={[]} />);
    expect(screen.getByText(/no attempts recorded/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    render(<PublicationHistory attempts={fixtures} />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
