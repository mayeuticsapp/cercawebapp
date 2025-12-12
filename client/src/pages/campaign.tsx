import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Send, Rocket, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";

type CampaignForm = {
  sender: string;
  subject: string;
  body: string;
};

export default function CampaignPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignForm>({
    defaultValues: {
      sender: "newsletter@nonsolomenu.app",
      subject: "Proposta di collaborazione",
      body: "Buongiorno,\n\nho visto il vostro locale e mi piacerebbe proporvi..."
    }
  });
  const { leads, updateLeadStatus } = useApp();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [, setLocation] = useLocation();

  const selectedLeads = leads.filter(l => l.status === 'selected');

  const onSendTest = () => {
    toast({
      title: "Email di Test Inviata",
      description: "Controlla la tua casella di posta.",
    });
  };

  const onSendCampaign = async (data: CampaignForm) => {
    setIsSending(true);
    
    // Simulate API call to Mailjet
    await new Promise(r => setTimeout(r, 2000));

    selectedLeads.forEach(lead => {
      updateLeadStatus(lead.id, 'sent');
    });

    setIsSending(false);
    toast({
      title: "Campagna Inviata con Successo",
      description: `Email inviate a ${selectedLeads.length} contatti.`,
      variant: "default",
    });

    setTimeout(() => setLocation("/contacts"), 1500);
  };

  if (selectedLeads.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-10 space-y-6">
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nessun destinatario selezionato</AlertTitle>
          <AlertDescription>
            Devi selezionare almeno un contatto dalla lista contatti prima di poter inviare una campagna.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation("/contacts")} variant="outline">Torna ai Contatti</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Nuova Campagna</h2>
        <p className="text-slate-500">Componi e invia la tua email ai contatti selezionati.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Composizione Email</CardTitle>
              <CardDescription>Configura il contenuto della mail che verrà inviata tramite Mailjet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sender">Mittente</Label>
                <Input id="sender" {...register("sender", { required: true })} />
                {errors.sender && <span className="text-xs text-red-500">Campo obbligatorio</span>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Oggetto</Label>
                <Input id="subject" {...register("subject", { required: true })} />
                {errors.subject && <span className="text-xs text-red-500">Campo obbligatorio</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Messaggio</Label>
                <Textarea 
                  id="body" 
                  className="min-h-[200px] font-sans" 
                  {...register("body", { required: true })} 
                />
                <p className="text-xs text-slate-400">Supporta testo semplice o HTML base.</p>
                {errors.body && <span className="text-xs text-red-500">Campo obbligatorio</span>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
              <Button variant="outline" type="button" onClick={onSendTest}>
                Invia Test
              </Button>
              <Button 
                onClick={handleSubmit(onSendCampaign)} 
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? (
                  <>Invio in corso...</>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" /> Invia Campagna
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Riepilogo Invio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Destinatari</span>
                <span className="font-bold text-slate-900">{selectedLeads.length}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Provider</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Mailjet API</span>
                </div>
              </div>
              <Separator />
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                ⚠️ Ricorda di includere il link di disiscrizione obbligatorio nel footer.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
