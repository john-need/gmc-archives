import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { DiscoverabilityBadge } from "@/app/components/DiscoverabilityBadge";

expect.extend(toHaveNoViolations);

describe("DiscoverabilityBadge", () => {
  it("conveys 'pending' to assistive tech, not color alone", () => {
    render(<DiscoverabilityBadge status="pending" />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("conveys 'discoverable' to assistive tech, not color alone", () => {
    render(<DiscoverabilityBadge status="discoverable" />);
    expect(screen.getByText(/discoverable/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    render(<DiscoverabilityBadge status="pending" />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
