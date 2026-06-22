import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ConversationSource {
  n: number;
  title: string;
  archiveDocumentId: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
  sources?: ConversationSource[];
  error?: boolean;
}

export interface ConversationState {
  messages: ConversationMessage[];
  draft: string;
  thinking: boolean;
}

const initialState: ConversationState = {
  messages: [],
  draft: "",
  thinking: false
};

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    draftChanged(state, action: PayloadAction<string>) {
      state.draft = action.payload;
    },
    sendStarted(state) {
      // ponytail: RTK's Immer-backed draft-mutation syntax is the documented
      // exception to the no-mutation rule (tasks.md preamble) — it preserves
      // the pure-reducer contract while reading as plain array mutation.
      if (state.thinking) {
        return;
      }
      const question = state.draft.trim();
      if (question.length === 0) {
        return;
      }
      state.messages.push({ role: "user", text: question });
      state.draft = "";
      state.thinking = true;
    },
    answerReceived(state, action: PayloadAction<{ text: string; sources: ConversationSource[] }>) {
      state.messages.push({ role: "assistant", text: action.payload.text, sources: action.payload.sources });
      state.thinking = false;
    },
    answerFailed(state) {
      state.messages.push({ role: "assistant", text: "", error: true });
      state.thinking = false;
    },
    retryRequested(state) {
      if (state.messages.length > 0 && state.messages[state.messages.length - 1].error) {
        state.messages.pop();
      }
      state.thinking = true;
    },
    newChatStarted(state) {
      state.messages = [];
      state.draft = "";
      state.thinking = false;
    }
  }
});

export const { draftChanged, sendStarted, answerReceived, answerFailed, retryRequested, newChatStarted } =
  conversationSlice.actions;
