import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { AskSearch } from "@/app/routes/AskSearch";
import type { ConversationMessage } from "@/app/store/conversationSlice";

expect.extend(toHaveNoViolations);

function renderAskSearch(overrides: Partial<Parameters<typeof AskSearch>[0]> = {}) {
  const props = {
    messages: [] as ConversationMessage[],
    draft: "",
    thinking: false,
    suggestedPrompts: ["When was the Long Trail completed?"],
    onDraftChange: jest.fn(),
    onSend: jest.fn(),
    onNewChat: jest.fn(),
    onRetry: jest.fn(),
    onOpenSource: jest.fn(),
    ...overrides
  };
  render(<AskSearch {...props} />);
  return props;
}

describe("AskSearch", () => {
  it("shows the welcome state with suggested prompts when there are no messages", () => {
    renderAskSearch();
    expect(screen.getByText(/what would you like to know/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /when was the long trail completed/i })).toBeInTheDocument();
  });

  it("clicking a suggested prompt sends it", async () => {
    const onDraftChange = jest.fn();
    const onSend = jest.fn();
    renderAskSearch({ onDraftChange, onSend });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /when was the long trail completed/i }));
    expect(onDraftChange).toHaveBeenCalledWith("When was the Long Trail completed?");
  });

  it("renders message thread with numbered source citations", () => {
    renderAskSearch({
      messages: [
        { role: "user", text: "When was the Long Trail completed?" },
        {
          role: "assistant",
          text: "It was completed in 1930. [1]",
          sources: [{ n: 1, title: "Trail Report", archiveDocumentId: "doc-1" }]
        }
      ]
    });
    expect(screen.getByText(/completed in 1930/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trail report/i })).toBeInTheDocument();
  });

  it("opens the source document when a citation is clicked", async () => {
    const onOpenSource = jest.fn();
    renderAskSearch({
      messages: [
        {
          role: "assistant",
          text: "Answer. [1]",
          sources: [{ n: 1, title: "Trail Report", archiveDocumentId: "doc-1" }]
        }
      ],
      onOpenSource
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /trail report/i }));
    expect(onOpenSource).toHaveBeenCalledWith("doc-1");
  });

  it("updates the draft as the user types and sends on submit when allowed", async () => {
    const onDraftChange = jest.fn();
    const onSend = jest.fn();
    renderAskSearch({ onDraftChange, onSend, draft: "ready" });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/ask a question/i), "x");
    expect(onDraftChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalled();
  });

  it("disables sending a new question while thinking, blocking interleaved answers", async () => {
    const onSend = jest.fn();
    renderAskSearch({ thinking: true, draft: "another question", onSend });
    const user = userEvent.setup();
    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
    await user.click(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows an inline error with retry when the last message failed", async () => {
    const onRetry = jest.fn();
    renderAskSearch({
      messages: [{ role: "user", text: "question" }],
      error: true,
      onRetry
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("clicking New chat clears the thread", async () => {
    const onNewChat = jest.fn();
    renderAskSearch({ messages: [{ role: "user", text: "hi" }], onNewChat });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new chat/i }));
    expect(onNewChat).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    renderAskSearch({
      messages: [
        { role: "user", text: "When was the Long Trail completed?" },
        { role: "assistant", text: "It was completed in 1930." }
      ]
    });
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
