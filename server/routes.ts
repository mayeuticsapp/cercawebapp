import type { Express } from "express";
import { createServer, type Server } from "http";
import { extractEmailFromWebsite, extractEmailsFromWebsites } from "./services/zyte";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Estrai email da un singolo sito web
  app.post("/api/extract-email", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL obbligatorio" });
      }

      const result = await extractEmailFromWebsite(url);
      res.json(result);
    } catch (error) {
      console.error("Errore estrazione email:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Errore durante l'estrazione" 
      });
    }
  });

  // Estrai email da multipli siti web
  app.post("/api/extract-emails-batch", async (req, res) => {
    try {
      const { websites } = req.body;
      
      if (!websites || !Array.isArray(websites) || websites.length === 0) {
        return res.status(400).json({ message: "Lista di siti web obbligatoria" });
      }

      const results = await extractEmailsFromWebsites(websites);
      
      // Converti Map in oggetto per JSON
      const resultsObj: Record<string, any> = {};
      results.forEach((value, key) => {
        resultsObj[key] = value;
      });
      
      res.json({ results: resultsObj, count: websites.length });
    } catch (error) {
      console.error("Errore estrazione email batch:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Errore durante l'estrazione" 
      });
    }
  });

  // Verifica stato API Zyte
  app.get("/api/zyte-status", async (req, res) => {
    const hasKey = !!process.env.ZYTE_API_KEY;
    res.json({ configured: hasKey });
  });

  return httpServer;
}
