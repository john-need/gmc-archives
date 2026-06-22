import { VertexAI } from "@google-cloud/vertexai";
import type { GenerativeAnswerModel, GroundingSource } from "@/lib/search/generativeAnswerModel";

export interface VertexGenerativeAnswerModelOptions {
  project: string;
  location: string;
  model: string;
}

function buildPrompt(question: string, sources: GroundingSource[]): string {
  const context = sources
    .map((source, index) => `[${index + 1}] (${source.archiveDocumentId}) ${source.text}`)
    .join("\n");
  return [
    "Answer the question using only the sources below. Cite sources by their bracketed number.",
    "If the sources do not contain the answer, say so plainly.",
    "",
    "Sources:",
    context,
    "",
    `Question: ${question}`
  ].join("\n");
}

export function createVertexGenerativeAnswerModel(options: VertexGenerativeAnswerModelOptions): GenerativeAnswerModel {
  const vertexAi = new VertexAI({ project: options.project, location: options.location });
  const model = vertexAi.getGenerativeModel({ model: options.model });

  return {
    async generate(question, sources) {
      const prompt = buildPrompt(question, sources);
      const result = await model.generateContent(prompt);
      const answer = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const citedDocumentIds = sources
        .filter((source, index) => answer.includes(`[${index + 1}]`))
        .map((source) => source.archiveDocumentId);
      return { answer, citedDocumentIds };
    }
  };
}
