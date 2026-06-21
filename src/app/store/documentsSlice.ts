import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface DocumentsState {
  selectedDocumentIds: string[];
}

const initialState: DocumentsState = { selectedDocumentIds: [] };

export const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    documentSelected(state, action: PayloadAction<string>) {
      // ponytail: RTK's Immer-backed draft-mutation syntax is the documented
      // exception to the no-mutation rule (tasks.md preamble) — it preserves
      // the pure-reducer contract while reading as plain array mutation.
      if (!state.selectedDocumentIds.includes(action.payload)) {
        state.selectedDocumentIds.push(action.payload);
      }
    },
    documentDeselected(state, action: PayloadAction<string>) {
      state.selectedDocumentIds = state.selectedDocumentIds.filter((id) => id !== action.payload);
    },
    selectionCleared(state) {
      state.selectedDocumentIds = [];
    }
  }
});

export const { documentSelected, documentDeselected, selectionCleared } = documentsSlice.actions;
