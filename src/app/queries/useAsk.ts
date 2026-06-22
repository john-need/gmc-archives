import { useMutation } from "@tanstack/react-query";
import type { ConversationSource } from "@/app/store/conversationSlice";

interface AskResponse {
  answer: string;
  sources: Array<{ archiveDocumentId: string; title: string; snippet: string }>;
}

async function postAsk(question: string): Promise<{ text: string; sources: ConversationSource[] }> {
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  if (!response.ok) {
    throw new Error("ASK_FAILED");
  }
  const body: AskResponse = await response.json();
  return {
    text: body.answer,
    sources: body.sources.map((source, index) => ({
      n: index + 1,
      title: source.title,
      archiveDocumentId: source.archiveDocumentId
    }))
  };
}

export function useAsk() {
  return useMutation({ mutationFn: postAsk });
}
