import { createRoot } from "react-dom/client";
import { App } from "@/app/index";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Missing #root element");
}
createRoot(container).render(<App />);
