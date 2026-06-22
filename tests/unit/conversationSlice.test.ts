import {
  answerFailed,
  answerReceived,
  conversationSlice,
  draftChanged,
  newChatStarted,
  retryRequested,
  sendStarted
} from "@/app/store/conversationSlice";

describe("conversationSlice", () => {
  it("updates the draft", () => {
    const state = conversationSlice.reducer(undefined, draftChanged("hello"));
    expect(state.draft).toBe("hello");
  });

  it("sendStarted pushes the user message, clears the draft, and sets thinking", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("When was it built?"));
    state = conversationSlice.reducer(state, sendStarted());
    expect(state.messages).toEqual([{ role: "user", text: "When was it built?" }]);
    expect(state.draft).toBe("");
    expect(state.thinking).toBe(true);
  });

  it("sendStarted is a no-op while already thinking (no interleaved answers)", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("first"));
    state = conversationSlice.reducer(state, sendStarted());
    state = conversationSlice.reducer(state, draftChanged("second"));
    state = conversationSlice.reducer(state, sendStarted());
    expect(state.messages).toHaveLength(1);
  });

  it("sendStarted is a no-op for a blank draft", () => {
    const state = conversationSlice.reducer(undefined, sendStarted());
    expect(state.messages).toHaveLength(0);
  });

  it("answerReceived appends the assistant message and clears thinking", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("q"));
    state = conversationSlice.reducer(state, sendStarted());
    state = conversationSlice.reducer(state, answerReceived({ text: "answer", sources: [] }));
    expect(state.messages[1]).toEqual({ role: "assistant", text: "answer", sources: [] });
    expect(state.thinking).toBe(false);
  });

  it("answerFailed appends an error message and clears thinking", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("q"));
    state = conversationSlice.reducer(state, sendStarted());
    state = conversationSlice.reducer(state, answerFailed());
    expect(state.messages[1]).toEqual({ role: "assistant", text: "", error: true });
    expect(state.thinking).toBe(false);
  });

  it("retryRequested removes a trailing error message and sets thinking", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("q"));
    state = conversationSlice.reducer(state, sendStarted());
    state = conversationSlice.reducer(state, answerFailed());
    state = conversationSlice.reducer(state, retryRequested());
    expect(state.messages).toEqual([{ role: "user", text: "q" }]);
    expect(state.thinking).toBe(true);
  });

  it("newChatStarted resets messages, draft, and thinking", () => {
    let state = conversationSlice.reducer(undefined, draftChanged("q"));
    state = conversationSlice.reducer(state, sendStarted());
    state = conversationSlice.reducer(state, newChatStarted());
    expect(state.messages).toEqual([]);
    expect(state.draft).toBe("");
    expect(state.thinking).toBe(false);
  });
});
