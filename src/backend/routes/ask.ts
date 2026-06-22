import { Router } from "express";
import { askHandler, type AskHandlerDeps } from "@/backend/ingestion/askHandler";

export type AskRoutesDeps = AskHandlerDeps;

export function createAskRoutes(deps: AskRoutesDeps): Router {
  const router = Router();

  router.post("/api/ask", async (req, res) => {
    const question: string = req.body?.question ?? "";
    const result = await askHandler(question, deps);
    if (result.outcome === "error") {
      res.status(502).json({ error: "ASK_FAILED" });
      return;
    }
    res.status(200).json({ answer: result.answer, sources: result.sources });
  });

  return router;
}
