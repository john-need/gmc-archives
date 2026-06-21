import { Router } from "express";
import type { CatalogStore } from "@/lib/catalog/catalogStore";
import type { SemanticIndex } from "@/lib/search/semanticIndex";
import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { semanticSearch } from "@/lib/search/semanticSearch";
import { downloadDocument } from "@/lib/storage/downloadDocument";

export interface CatalogRoutesDeps {
  store: MemoryStore;
  catalogStore: CatalogStore;
  semanticIndex: SemanticIndex;
  documentStorage: DocumentStorage;
}

export function createCatalogRoutes(deps: CatalogRoutesDeps): Router {
  const router = Router();

  router.get("/api/catalog/search", async (req, res) => {
    const { q, title, section, date, includeSuperseded } = req.query;
    const results = await semanticSearch(
      typeof q === "string" ? q : "",
      {
        title: typeof title === "string" ? title : undefined,
        section: typeof section === "string" ? section : undefined,
        date: typeof date === "string" ? date : undefined,
        includeSuperseded: includeSuperseded === "true"
      },
      { semanticIndex: deps.semanticIndex, catalogStore: deps.catalogStore }
    );
    res.status(200).json({ results });
  });

  router.get("/api/documents/:id/download", async (req, res) => {
    const document = deps.store.archiveDocuments.get(req.params.id);
    if (document === undefined) {
      res.status(404).json({ error: "SOURCE_UNAVAILABLE" });
      return;
    }
    const version = typeof req.query.version === "string" ? Number(req.query.version) : undefined;
    try {
      const { stream, contentType } = await downloadDocument(document, version, { documentStorage: deps.documentStorage });
      res.status(200).setHeader("Content-Type", contentType);
      const reader = stream.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        res.write(value);
      }
      res.end();
    } catch {
      res.status(404).json({ error: "SOURCE_UNAVAILABLE" });
    }
  });

  return router;
}
