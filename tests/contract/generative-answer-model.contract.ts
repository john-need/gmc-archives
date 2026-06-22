import { createFakeGenerativeAnswerModel } from "@/lib/search/fakeGenerativeAnswerModel";

describe("GenerativeAnswerModel contract: fake", () => {
  it("returns a non-empty answer and citedDocumentIds that is a subset of the supplied sources", async () => {
    const model = createFakeGenerativeAnswerModel();
    const result = await model.generate("When was the Long Trail completed?", [
      { archiveDocumentId: "doc-1", text: "The Long Trail was completed in 1930." },
      { archiveDocumentId: "doc-2", text: "Unrelated content about maps." }
    ]);
    expect(result.answer.length).toBeGreaterThan(0);
    for (const id of result.citedDocumentIds) {
      expect(["doc-1", "doc-2"]).toContain(id);
    }
  });

  it("does not throw with an empty sources array, and indicates no grounding was available", async () => {
    const model = createFakeGenerativeAnswerModel();
    const result = await model.generate("anything", []);
    expect(result.citedDocumentIds).toEqual([]);
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same (question, sources) pair", async () => {
    const model = createFakeGenerativeAnswerModel();
    const sources = [{ archiveDocumentId: "doc-1", text: "Some text." }];
    const first = await model.generate("question", sources);
    const second = await model.generate("question", sources);
    expect(first).toEqual(second);
  });

  it("propagates a thrown error rather than swallowing it", async () => {
    const model = createFakeGenerativeAnswerModel({ throwError: true });
    await expect(model.generate("question", [])).rejects.toThrow();
  });
});
