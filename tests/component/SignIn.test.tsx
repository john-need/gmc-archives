import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SignIn } from "@/app/routes/SignIn";
import { RequestAccess } from "@/app/routes/RequestAccess";

expect.extend(toHaveNoViolations);

describe("SignIn", () => {
  it("triggers Google sign-in when the button is clicked", async () => {
    const onSignIn = jest.fn();
    render(<SignIn onSignIn={onSignIn} onGoToRequestAccess={jest.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(onSignIn).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    render(<SignIn onSignIn={jest.fn()} onGoToRequestAccess={jest.fn()} />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});

describe("RequestAccess", () => {
  function renderForm(overrides: Partial<Parameters<typeof RequestAccess>[0]> = {}) {
    const props = {
      submitted: false,
      onSubmit: jest.fn(),
      onBackToSignIn: jest.fn(),
      ...overrides
    };
    render(<RequestAccess {...props} />);
    return props;
  }

  it("shows a validation message when required fields are missing or the email is invalid", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /submit request/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/please enter/i)).toBeInTheDocument();
  });

  it("submits with valid required fields", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "A One");
    await user.type(screen.getByLabelText(/email/i), "a@example.org");
    await user.type(screen.getByLabelText(/reason/i), "Local history research");
    await user.click(screen.getByRole("button", { name: /submit request/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "A One",
      email: "a@example.org",
      affiliation: "",
      reason: "Local history research"
    });
  });

  it("shows a confirmation by name once submitted", () => {
    renderForm({ submitted: true, submittedName: "A One" });
    expect(screen.getByText(/a one/i)).toBeInTheDocument();
    expect(screen.getByText(/request submitted/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    renderForm();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
