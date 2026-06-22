import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { SideNav } from "@/app/components/SideNav";
import type { User } from "@/lib/types";

expect.extend(toHaveNoViolations);

const researcher: User = { id: "user-1", role: "viewer", identityProvider: "google" };
const editor: User = { id: "user-2", role: "publisher", identityProvider: "google" };

describe("SideNav", () => {
  it("shows Researcher's role label and hides Upload/Access Requests for a Researcher", () => {
    render(
      <MemoryRouter>
        <SideNav user={researcher} onSignOut={jest.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /upload/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /access requests/i })).not.toBeInTheDocument();
  });

  it("shows Editor's role label and Upload/Access Requests links for an Editor", () => {
    render(
      <MemoryRouter>
        <SideNav user={editor} onSignOut={jest.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /access requests/i })).toBeInTheDocument();
  });

  it("calls onSignOut when clicked", async () => {
    const onSignOut = jest.fn();
    render(
      <MemoryRouter>
        <SideNav user={researcher} onSignOut={onSignOut} />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    render(
      <MemoryRouter>
        <SideNav user={editor} onSignOut={jest.fn()} />
      </MemoryRouter>
    );
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
