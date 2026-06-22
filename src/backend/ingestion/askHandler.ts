import { semanticSearch } from "@/lib/search/semanticSearch";
import { buildGroundingSources } from "@/lib/search/buildGroundingSources";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { GenerativeAnswerModel } from "@/lib/search/generativeAnswerModel";
import { emitLogEntry } from "@/lib/logging";
import type { MemoryStore } from "@/backend/store/memoryStore";

export interface AskHandlerDeps {
  store: MemoryStore;
  catalogStore: CatalogStore;
  semanticIndex: SemanticIndex;
  generativeAnswerModel: GenerativeAnswerModel;
}

export interface AskResultSource {
  archiveDocumentId: string;
  title: string;
  snippet: string;
}

export type AskResult =
  | { outcome: "success"; answer: string; sources: AskResultSource[] }
  | { outcome: "error" };

export async function askHandler(question: string, deps: AskHandlerDeps): Promise<AskResult> {
  try {
    const entries = await semanticSearch(question, {}, { semanticIndex: deps.semanticIndex, catalogStore: deps.catalogStore });
    const groundingSources = buildGroundingSources(entries, deps.store.okfRecords);
    const { answer, citedDocumentIds } = await deps.generativeAnswerModel.generate(question, groundingSources);

    const sources: AskResultSource[] = entries
      .filter((entry) => citedDocumentIds.includes(entry.archiveDocumentId))
      .map((entry) => {
        const record = deps.store.okfRecords.get(entry.okfRecordId);
        return {
          archiveDocumentId: entry.archiveDocumentId,
          title: entry.searchableFields.title,
          snippet: record?.body.slice(0, 200) ?? ""
        };
      });

    emitLogEntry({
      severity: "INFO",
      message: "ask",
      question,
      retrievedDocumentIds: entries.map((entry) => entry.archiveDocumentId),
      answerLength: answer.length,
      outcome: "success"
    });

    return { outcome: "success", answer, sources };
  } catch {
    emitLogEntry({
      severity: "ERROR",
      message: "ask",
      question,
      retrievedDocumentIds: [],
      answerLength: 0,
      outcome: "failure"
    });
    return { outcome: "error" };
  }
}
