import type { GenerativeAnswer, GenerativeAnswerModel, GroundingSource } from "@/lib/search/generativeAnswerModel";

export interface FakeGenerativeAnswerModelOptions {
  throwError?: boolean;
}

export function createFakeGenerativeAnswerModel(options: FakeGenerativeAnswerModelOptions = {}): GenerativeAnswerModel {
  return {
    async generate(question: string, sources: GroundingSource[]): Promise<GenerativeAnswer> {
      if (options.throwError) {
        throw new Error("generative model unavailable");
      }
      if (sources.length === 0) {
        return {
          answer: `I couldn't find anything in the catalog directly related to "${question}".`,
          citedDocumentIds: []
        };
      }
      const summary = sources.map((source, index) => `${source.text} [${index + 1}]`).join(" ");
      return {
        answer: `Based on the catalog: ${summary}`,
        citedDocumentIds: sources.map((source) => source.archiveDocumentId)
      };
    }
  };
}
