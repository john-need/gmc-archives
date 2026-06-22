import { createRoot } from "react-dom/client";
import { App } from "@/app/index";
import { getAuthToken } from "@/app/auth/authToken";

// ponytail: every query hook calls the bare fetch() API against relative
// "/api/..." paths; patching fetch once here attaches the bearer token
// instead of threading an Authorization header through each hook.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const token = getAuthToken();
  if (token === null) {
    return nativeFetch(input, init);
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return nativeFetch(input, { ...init, headers });
};

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Missing #root element");
}
createRoot(container).render(<App />);
