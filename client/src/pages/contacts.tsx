import { useState } from "react";
import { useApp } from "@/lib/store";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Trash2, Send, Mail, Globe, Loader2, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ContactsPage() {
  const { leads, toggleLeadSelection, extractEmail, extractEmailsForSelected, deleteLead, isLoading } = useApp();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleExtractSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast({
        title: "Nessun lead selezionato",
        description: "Seleziona almeno un lead per estrarre le email.",
        variant: "destructive"
      });
      return;
    }
    await extractEmailsForSelected(ids);
  };

  const handleExport = () => {
    const csvContent = [
      ["Nome", "Sito Web", "Email", "Stato Email"].join(","),
      ...leads.map(l => [
        `"${l.name}"`,
        `"${l.website}"`,
        `"${l.email || ''}"`,
        `"${l.emailStatus}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads_export.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Esportazione completata",
      description: "Il file CSV e stato scaricato."
    });
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteLead(id);
    }
    setSelectedIds(new Set());
    toast({
      title: "Lead eliminati",
      description: `${ids.length} lead eliminati con successo.`
    });
  };

  const getEmailStatusBadge = (status: string, email: string | null) => {
    switch (status) {
      case 'found':
        return <Badge className="bg-green-100 text-green-700 border-green-200">{email}</Badge>;
      case 'not_found':
        return <Badge variant="outline" className="text-slate-500">Non trovata</Badge>;
      case 'extracting':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Loader2 className="w-3 h-3 animate-spin mr-1" />Estrazione...</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      default:
        return <Badge variant="secondary">Da estrarre</Badge>;
    }
  };

  const pendingCount = leads.filter(l => l.emailStatus === 'pending').length;
  const foundCount = leads.filter(l => l.emailStatus === 'found').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Lista Contatti</h2>
          <p className="text-slate-500">
            {leads.length} lead totali - {foundCount} email trovate - {pendingCount} da estrarre
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleExtractSelected}
            disabled={selectedIds.size === 0}
            data-testid="button-extract-selected"
          >
            <Search className="w-4 h-4 mr-2" />
            Estrai Email ({selectedIds.size})
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="text-red-600 hover:text-red-700"
            data-testid="button-delete-selected"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Elimina ({selectedIds.size})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Tutti i contatti</CardTitle>
              <CardDescription>
                Seleziona i lead e clicca "Estrai Email" per trovare le email dai siti web.
              </CardDescription>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-add-more">
                + Aggiungi Lead
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-slate-500 mt-2">Caricamento...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Nessun lead inserito.</p>
              <Link href="/">
                <Button variant="link" className="text-blue-600" data-testid="link-add-first">Aggiungi il primo lead</Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedIds.size === leads.length && leads.length > 0}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Attivita</TableHead>
                    <TableHead>Sito Web</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className={selectedIds.has(lead.id) ? "bg-blue-50/50" : ""}
                      data-testid={`row-lead-${lead.id}`}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => handleToggleSelect(lead.id)}
                          data-testid={`checkbox-lead-${lead.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{lead.name}</div>
                        {lead.city && (
                          <div className="text-xs text-slate-500">{lead.city}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          data-testid={`link-website-${lead.id}`}
                        >
                          <Globe className="w-3 h-3" />
                          {lead.website.replace(/^https?:\/\//, '').slice(0, 30)}
                        </a>
                      </TableCell>
                      <TableCell>
                        {getEmailStatusBadge(lead.emailStatus, lead.email)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => extractEmail(lead.id)}
                            disabled={lead.emailStatus === 'extracting'}
                            title="Estrai email"
                            data-testid={`button-extract-${lead.id}`}
                          >
                            {lead.emailStatus === 'extracting' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteLead(lead.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Elimina"
                            data-testid={`button-delete-${lead.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
