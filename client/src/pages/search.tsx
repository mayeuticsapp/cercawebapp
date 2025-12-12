import { useState } from "react";
import { useForm } from "react-hook-form";
import { Search as SearchIcon, MapPin, Store, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

type SearchForm = {
  city: string;
  category: string;
};

export default function SearchPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<SearchForm>();
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const { addLeads } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const onSubmit = async (data: SearchForm) => {
    setIsSearching(true);
    setProgress(0);
    setStatusMessage("Inizializzazione Zyte Web Scraper...");

    try {
      setProgress(10);
      setStatusMessage(`Ricerca "${data.category}" a ${data.city} su Google Maps...`);
      
      const response = await apiRequest("POST", "/api/search", {
        city: data.city,
        category: data.category,
      });
      
      setProgress(90);
      setStatusMessage("Elaborazione risultati...");
      
      const result = await response.json();
      
      if (result.leads && result.leads.length > 0) {
        addLeads(result.leads);
        setProgress(100);
        setStatusMessage("Completato!");
        
        toast({
          title: "Ricerca Completata",
          description: `Trovati ${result.count} nuovi contatti potenziali.`,
        });
        
        setTimeout(() => setLocation("/contacts"), 1000);
      } else {
        toast({
          title: "Nessun Risultato",
          description: "Nessuna attività trovata per questa ricerca.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Errore ricerca:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la ricerca",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto mt-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Nuova Ricerca</h2>
        <p className="text-slate-500">Trova nuovi clienti B2B nella tua zona in pochi secondi.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Parametri di Ricerca</CardTitle>
          <CardDescription>Inserisci città e categoria merceologica per avviare lo scraper.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Città
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    {...register("city", { required: true })}
                    placeholder="Es. Roma, Milano..." 
                    className="pl-9"
                    disabled={isSearching}
                  />
                </div>
                {errors.city && <span className="text-xs text-red-500">Campo obbligatorio</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Categoria
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    {...register("category", { required: true })}
                    placeholder="Es. Ristoranti, Architetti..." 
                    className="pl-9"
                    disabled={isSearching}
                  />
                </div>
                {errors.category && <span className="text-xs text-red-500">Campo obbligatorio</span>}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Elaborazione in corso...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" /> Avvia Ricerca
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>Status: <span className="font-medium text-blue-600">{statusMessage}</span></span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 font-mono">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Connessione API Zyte stabilita...
              </p>
              {progress > 20 && (
                <p className="flex items-center gap-2 mt-2">
                   <CheckCircle2 className="w-3 h-3 text-green-600" />
                   Scraping Google Maps avviato
                </p>
              )}
              {progress > 50 && (
                <p className="flex items-center gap-2 mt-2">
                   <CheckCircle2 className="w-3 h-3 text-green-600" />
                   Analisi siti web in parallelo (5 threads)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
