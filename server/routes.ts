import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchBusinesses } from "./services/zyte";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API per lo scraping con Zyte
  app.post("/api/search", async (req, res) => {
    try {
      const { city, category } = req.body;
      
      if (!city || !category) {
        return res.status(400).json({ message: "Città e categoria sono obbligatori" });
      }

      const leads = await searchBusinesses(city, category);
      res.json({ leads, count: leads.length });
    } catch (error) {
      console.error("Errore nella ricerca:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Errore durante la ricerca" 
      });
    }
  });

  return httpServer;
}
