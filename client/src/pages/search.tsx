import { useState } from "react";
import { Plus, Upload, Globe, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";

export default function SearchPage() {
  const [singleName, setSingleName] = useState("");
  const [singleUrl, setSingleUrl] = useState("");
  const [singleCity, setSingleCity] = useState("");
  const [singleCategory, setSingleCategory] = useState("");
  const [urlList, setUrlList] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const { addLead, addLeadsFromList } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAddSingle = async () => {
    if (!singleUrl.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci almeno l'URL del sito web.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      await addLead({
        name: singleName.trim() || "",
        website: singleUrl.trim(),
        city: singleCity.trim(),
        category: singleCategory.trim()
      });
      setSingleName("");
      setSingleUrl("");
      setSingleCity("");
      setSingleCategory("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleImportList = async () => {
    const urls = urlList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (urls.length === 0) {
      toast({
        title: "Errore",
        description: "Inserisci almeno un URL.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      await addLeadsFromList(urls);
      setUrlList("");
      toast({
        title: "Importazione completata",
        description: `${urls.length} siti web importati. Vai alla lista contatti per estrarre le email.`
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const urls = lines.map(line => {
        const parts = line.split(',');
        return parts[0].trim();
      }).filter(url => url.length > 0);

      setUrlList(urls.join('\n'));
      toast({
        title: "File caricato",
        description: `Trovati ${urls.length} URL nel file.`
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto mt-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Aggiungi Lead</h2>
        <p className="text-slate-500">Inserisci i siti web delle attivit&agrave; per estrarre le email di contatto.</p>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" data-testid="tab-single">
            <Plus className="w-4 h-4 mr-2" />
            Singolo
          </TabsTrigger>
          <TabsTrigger value="bulk" data-testid="tab-bulk">
            <Upload className="w-4 h-4 mr-2" />
            Importazione Massiva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Aggiungi Singolo Lead</CardTitle>
              <CardDescription>Inserisci i dati di una singola attivit&agrave;.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sito Web *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    placeholder="www.esempio.it"
                    className="pl-9"
                    disabled={isAdding}
                    data-testid="input-website"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Attivit&agrave; (opzionale)</label>
                <Input
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Es. Ristorante Da Mario"
                  disabled={isAdding}
                  data-testid="input-name"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Citt&agrave; (opzionale)</label>
                  <Input
                    value={singleCity}
                    onChange={(e) => setSingleCity(e.target.value)}
                    placeholder="Es. Roma"
                    disabled={isAdding}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria (opzionale)</label>
                  <Input
                    value={singleCategory}
                    onChange={(e) => setSingleCategory(e.target.value)}
                    placeholder="Es. Ristoranti"
                    disabled={isAdding}
                    data-testid="input-category"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddSingle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                disabled={isAdding}
                data-testid="button-add-single"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aggiunta in corso...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Aggiungi Lead
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Importazione Massiva</CardTitle>
              <CardDescription>Incolla una lista di URL (uno per riga) o carica un file CSV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lista URL</label>
                <Textarea
                  value={urlList}
                  onChange={(e) => setUrlList(e.target.value)}
                  placeholder={"www.esempio1.it\nwww.esempio2.it\nwww.esempio3.it"}
                  className="min-h-[200px] font-mono text-sm"
                  disabled={isAdding}
                  data-testid="textarea-urls"
                />
                <p className="text-xs text-slate-500">Inserisci un URL per riga</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400">oppure</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carica File CSV</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:underline">Seleziona file</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isAdding}
                      data-testid="input-file"
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">CSV o TXT con URL nella prima colonna</p>
                </div>
              </div>

              <Button
                onClick={handleImportList}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                disabled={isAdding || !urlList.trim()}
                data-testid="button-import"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importazione in corso...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Importa {urlList.split('\n').filter(l => l.trim()).length || 0} URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center">
        <Button variant="outline" onClick={() => setLocation("/contacts")} data-testid="button-go-contacts">
          Vai alla Lista Contatti
        </Button>
      </div>
    </div>
  );
}
