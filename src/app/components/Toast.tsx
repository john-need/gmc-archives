import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ToastEntry {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 2300;

export function ToastProvider(props: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {props.children}
      <div aria-live="polite" style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 60 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              background: "#2A2520",
              color: "#FBF8F3",
              padding: "11px 20px",
              borderRadius: 999,
              fontSize: "13.5px",
              fontWeight: 500,
              boxShadow: "0 12px 30px rgba(40,25,15,.3)",
              display: "flex",
              alignItems: "center",
              gap: 9
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A6BE82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5L20 7" />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
