import type { ConversationMessage } from "@/app/store/conversationSlice";

export interface AskSearchProps {
  messages: ConversationMessage[];
  draft: string;
  thinking: boolean;
  suggestedPrompts: string[];
  error?: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  onRetry: () => void;
  onOpenSource: (archiveDocumentId: string) => void;
}

export function AskSearch(props: AskSearchProps): JSX.Element {
  const canSend = props.draft.trim().length > 0 && !props.thinking;

  return (
    <main>
      <h1>Ask &amp; Search</h1>
      <button type="button" onClick={props.onNewChat}>
        New chat
      </button>

      {props.messages.length === 0 ? (
        <div>
          <h2>What would you like to know?</h2>
          <div>
            {props.suggestedPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => props.onDraftChange(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul aria-label="Conversation">
          {props.messages.map((message, index) => (
            <li key={index}>
              <p>{message.text}</p>
              {message.sources !== undefined && message.sources.length > 0 && (
                <div>
                  {message.sources.map((source) => (
                    <button key={source.archiveDocumentId} type="button" onClick={() => props.onOpenSource(source.archiveDocumentId)}>
                      {source.title}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {props.thinking && <p role="status">Searching the catalog…</p>}

      {props.error === true && (
        <div role="alert">
          <p>Couldn&apos;t reach the archive&apos;s search service.</p>
          <button type="button" onClick={props.onRetry}>
            Retry
          </button>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) {
            props.onSend();
          }
        }}
      >
        <label htmlFor="ask-search-input">Ask a question</label>
        <textarea
          id="ask-search-input"
          value={props.draft}
          onChange={(event) => props.onDraftChange(event.target.value)}
        />
        <button type="submit" disabled={!canSend}>
          Send
        </button>
      </form>
    </main>
  );
}
