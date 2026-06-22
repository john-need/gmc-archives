import type { ConversationMessage } from "@/app/store/conversationSlice";
import { COLORS, headerStyle, secondaryButtonStyle, sendButtonStyle } from "@/app/styleTokens";

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
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>Ask &amp; Search</h2>
        <button type="button" onClick={props.onNewChat} style={secondaryButtonStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New chat
        </button>
      </header>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {props.messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <div style={{ maxWidth: 620, width: "100%", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, margin: "0 auto 20px", borderRadius: 4, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.5 2a7.5 7.5 0 0 1 5.96 12.06l4.24 4.24a1 1 0 0 1-1.41 1.41l-4.24-4.24A7.5 7.5 0 1 1 9.5 2z" />
                </svg>
              </div>
              <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 700, letterSpacing: "-.025em" }}>What would you like to know?</h1>
              <p style={{ margin: "0 0 28px", color: COLORS.textMuted, fontSize: "15.5px", lineHeight: 1.55 }}>
                Ask in plain language. Every answer is grounded in your catalog, with sources you can open and download.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {props.suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => props.onDraftChange(prompt)}
                    style={{
                      textAlign: "left",
                      padding: "11px 15px",
                      borderRadius: 3,
                      border: "1px solid #E6DDD0",
                      background: COLORS.card,
                      color: "#3A342C",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      maxWidth: 280
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ul aria-label="Conversation" style={{ listStyle: "none", margin: 0, padding: "30px 36px 18px", maxWidth: 720, width: "100%", boxSizing: "border-box", alignSelf: "center", display: "flex", flexDirection: "column", gap: 26 }}>
            {props.messages.map((message, index) => (
              <li key={index}>
                {message.role === "user" ? (
                  <p
                    style={{
                      margin: 0,
                      alignSelf: "flex-end",
                      maxWidth: "80%",
                      background: "#E5EAD0",
                      color: "#3A2E24",
                      padding: "12px 16px",
                      borderRadius: "3px 3px 1px 3px",
                      fontSize: 15,
                      lineHeight: 1.5,
                      display: "inline-block"
                    }}
                  >
                    {message.text}
                  </p>
                ) : (
                  <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, flex: "none", borderRadius: 2, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3v3" />
                        <path d="M12 18v3" />
                        <circle cx="12" cy="12" r="4" />
                        <path d="M19 5l-2 2" />
                        <path d="M7 17l-2 2" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, lineHeight: 1.6, color: COLORS.text, whiteSpace: "pre-wrap" }}>
                        {message.text}
                      </p>
                      {message.sources !== undefined && message.sources.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
                          {message.sources.map((source) => (
                            <button
                              key={source.archiveDocumentId}
                              type="button"
                              onClick={() => props.onOpenSource(source.archiveDocumentId)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "6px 11px 6px 7px",
                                borderRadius: 2,
                                border: "1px solid #E6DDD0",
                                background: COLORS.cardAlt,
                                color: "#5C544A",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              <span
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 999,
                                  background: COLORS.accent,
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                              >
                                {source.n}
                              </span>
                              {source.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
            {props.thinking && (
              <li role="status" style={{ display: "flex", gap: 13, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, flex: "none", borderRadius: 2, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v3" />
                    <path d="M12 18v3" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M19 5l-2 2" />
                    <path d="M7 17l-2 2" />
                  </svg>
                </div>
                <span style={{ color: COLORS.textNav, fontSize: "13.5px" }}>Searching the catalog…</span>
              </li>
            )}
          </ul>
        )}

        {props.error === true && (
          <div role="alert" style={{ maxWidth: 720, width: "100%", boxSizing: "border-box", alignSelf: "center", padding: "0 36px 14px", color: COLORS.danger, fontSize: "13.5px" }}>
            <p style={{ margin: "0 0 8px" }}>Couldn&apos;t reach the archive&apos;s search service.</p>
            <button type="button" onClick={props.onRetry} style={secondaryButtonStyle}>
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
          style={{ flex: "none", padding: "14px 36px 22px", borderTop: `1px solid ${COLORS.borderLight}`, background: "#F8F4ED" }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              padding: "8px 8px 8px 16px"
            }}
          >
            <label htmlFor="ask-search-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
              Ask a question
            </label>
            <textarea
              id="ask-search-input"
              value={props.draft}
              onChange={(event) => props.onDraftChange(event.target.value)}
              placeholder="Ask anything about your documents…"
              rows={1}
              style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", fontSize: 15, lineHeight: 1.5, color: COLORS.text, padding: "7px 0", fontFamily: "inherit" }}
            />
            <button type="submit" disabled={!canSend} style={sendButtonStyle(canSend)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5" />
                <path d="m6 11 6-6 6 6" />
              </svg>
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Send</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
