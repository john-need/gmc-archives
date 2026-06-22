import { configureStore } from "@reduxjs/toolkit";
import { documentsSlice } from "@/app/store/documentsSlice";
import { conversationSlice } from "@/app/store/conversationSlice";

export const store = configureStore({
  reducer: {
    documents: documentsSlice.reducer,
    conversation: conversationSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
