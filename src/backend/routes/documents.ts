import { Router } from "express";
import type { DocumentStorage } from "@/lib/storage/documentStorage";
import type { DocumentProcessor } from "@/lib/conversion/documentProcessor";
import type { IngestionQueue } from "@/backend/ingestion/ingestionQueue";
import type { MemoryStore } from "@/backend/store/memoryStore";
import { convertDocument } from "@/backend/ingestion/conversionHandler";

export interface DocumentsRoutesDeps {
  store: MemoryStore;
  documentStorage: DocumentStorage;
  documentProcessor: DocumentProcessor;
  ingestionQueue: IngestionQueue;
}

export function createDocumentsRoutes(deps: DocumentsRoutesDeps): Router {
  const router = Router();

  router.get("/api/documents", (req, res) => {
    const { section, q } = req.query;
    let documents = Array.from(deps.store.archiveDocuments.values());
    if (typeof section === "string") {
      documents = documents.filter((doc) => doc.section === section);
    }
    if (typeof q === "string") {
      const needle = q.toLowerCase();
      documents = documents.filter((doc) => doc.title.toLowerCase().includes(needle));
    }
    res.status(200).json({ documents });
  });

  router.get("/api/documents/:id", (req, res) => {
    const document = deps.store.archiveDocuments.get(req.params.id);
    if (document === undefined) {
      res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      return;
    }
    res.status(200).json(document);
  });

  router.post("/api/documents/:id/convert", async (req, res) => {
    const document = deps.store.archiveDocuments.get(req.params.id);
    if (document === undefined) {
      res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      return;
    }

    const result = await convertDocument(document, {
      documentStorage: deps.documentStorage,
      documentProcessor: deps.documentProcessor,
      ingestionQueue: deps.ingestionQueue
    });

    if (result.outcome === "error" && result.error === "INCOMPLETE_METADATA") {
      res.status(422).json({ error: result.error, missingFields: result.missingFields });
      return;
    }
    if (result.outcome === "error") {
      res.status(422).json({ error: result.error });
      return;
    }

    deps.store.okfRecords.set(result.okfRecord.id, result.okfRecord);
    res.status(200).json({ okfRecord: result.okfRecord });
  });

  return router;
}
