import { documentDeselected, documentSelected, documentsSlice, selectionCleared } from "@/app/store/documentsSlice";

describe("documentsSlice", () => {
  it("adds a document id on selection, without duplicates", () => {
    let state = documentsSlice.reducer(undefined, documentSelected("doc-1"));
    state = documentsSlice.reducer(state, documentSelected("doc-1"));
    expect(state.selectedDocumentIds).toEqual(["doc-1"]);
  });

  it("removes a document id on deselection", () => {
    let state = documentsSlice.reducer(undefined, documentSelected("doc-1"));
    state = documentsSlice.reducer(state, documentDeselected("doc-1"));
    expect(state.selectedDocumentIds).toEqual([]);
  });

  it("clears the selection", () => {
    let state = documentsSlice.reducer(undefined, documentSelected("doc-1"));
    state = documentsSlice.reducer(state, selectionCleared());
    expect(state.selectedDocumentIds).toEqual([]);
  });
});
