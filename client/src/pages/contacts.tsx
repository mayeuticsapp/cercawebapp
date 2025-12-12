import React from "react";
import { useApp } from "@/lib/store";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Trash2, Send, Mail, Globe, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ContactsPage() {
  const { leads, toggleLeadSelection, selectedLeadsCount } = useApp();
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Esportazione avviata",
      description: "Il file CSV è stato scaricato correttamente.",
    });
  };

  const selectedCount = leads.filter(l => l.status === 'selected').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lista Contatti</h2>
          <p className="text-slate-500">Gestisci i lead trovati e prepara le tue campagne.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Link href="/campaign">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={selectedCount === 0}>
              <Send className="w-4 h-4 mr-2" />
              Invia a ({selectedCount})
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tutti i contatti ({leads.length})</CardTitle>
          <CardDescription>
            Seleziona i contatti a cui vuoi inviare la campagna email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Nessun contatto trovato.</p>
              <Link href="/">
                <Button variant="link" className="text-blue-600">Avvia una nuova ricerca</Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      {/* Global select could go here */}
                    </TableHead>
                    <TableHead>Attività</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sito Web</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className={lead.status === 'selected' ? "bg-blue-50/50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={lead.status === 'selected'}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                           <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {lead.email}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Non trovata</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                          <Globe className="w-3 h-3" />
                          {lead.website}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.status === 'selected' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Selezionato</Badge>}
                        {lead.status === 'new' && <Badge variant="outline" className="text-slate-500">Nuovo</Badge>}
                        {lead.status === 'sent' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Inviato</Badge>}
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
