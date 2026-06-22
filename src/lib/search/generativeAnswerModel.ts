export interface GroundingSource {
  archiveDocumentId: string;
  text: string;
}

export interface GenerativeAnswer {
  answer: string;
  citedDocumentIds: string[];
}

export interface GenerativeAnswerModel {
  generate(question: string, sources: GroundingSource[]): Promise<GenerativeAnswer>;
}
