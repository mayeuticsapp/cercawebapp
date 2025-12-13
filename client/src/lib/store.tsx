import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface Lead {
  id: string;
  name: string;
  website: string;
  phone: string;
  address: string;
  email: string | null;
  emailStatus: 'pending' | 'extracting' | 'found' | 'not_found' | 'error';
  source: 'website' | 'facebook' | 'maps' | 'manual';
  status: 'new' | 'selected' | 'sent' | 'archived';
  city?: string;
  category?: string;
}

interface AppContextType {
  leads: Lead[];
  isLoading: boolean;
  addLead: (lead: { name: string; website: string; city?: string; category?: string }) => Promise<void>;
  addLeadsFromList: (urls: string[]) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  extractEmail: (id: string) => Promise<void>;
  extractEmailsForSelected: (ids: string[]) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<void>;
  toggleLeadSelection: (id: string) => Promise<void>;
  selectedLeadsCount: number;
  refreshLeads: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Errore caricamento dati",
        description: error.message,
        variant: "destructive"
      });
    } else {
      const mappedLeads: Lead[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.company_name,
        website: item.website || '',
        phone: item.phone || '',
        address: item.address || '',
        email: item.email,
        emailStatus: item.email ? 'found' : (item.email_status || 'pending'),
        source: item.source || 'manual',
        status: item.status,
        city: item.city,
        category: item.category
      }));
      setLeads(mappedLeads);
    }
    setIsLoading(false);
  };

  const addLead = async (lead: { name: string; website: string; city?: string; category?: string }) => {
    const leadToInsert = {
      company_name: lead.name || extractNameFromUrl(lead.website),
      website: normalizeUrl(lead.website),
      phone: '',
      address: '',
      email: null,
      email_status: 'pending',
      source: 'manual',
      status: 'new',
      city: lead.city || '',
      category: lead.category || ''
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([leadToInsert])
      .select();

    if (error) {
      console.error('Error inserting lead:', error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    } else if (data && data[0]) {
      const newLead: Lead = {
        id: data[0].id,
        name: data[0].company_name,
        website: data[0].website || '',
        phone: data[0].phone || '',
        address: data[0].address || '',
        email: data[0].email,
        emailStatus: 'pending',
        source: 'manual',
        status: 'new',
        city: data[0].city,
        category: data[0].category
      };
      setLeads(prev => [newLead, ...prev]);
      toast({
        title: "Lead aggiunto",
        description: `${newLead.name} aggiunto con successo.`
      });
    }
  };

  const addLeadsFromList = async (urls: string[]) => {
    const validUrls = urls.filter(url => url.trim().length > 0);
    if (validUrls.length === 0) return;

    const leadsToInsert = validUrls.map(url => ({
      company_name: extractNameFromUrl(url),
      website: normalizeUrl(url),
      phone: '',
      address: '',
      email: null,
      email_status: 'pending',
      source: 'manual',
      status: 'new',
      city: '',
      category: ''
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('Error inserting leads:', error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      const newLeads: Lead[] = data.map((item: any) => ({
        id: item.id,
        name: item.company_name,
        website: item.website || '',
        phone: item.phone || '',
        address: item.address || '',
        email: item.email,
        emailStatus: 'pending',
        source: 'manual',
        status: 'new',
        city: item.city,
        category: item.category
      }));
      setLeads(prev => [...newLeads, ...prev]);
      toast({
        title: "Lead importati",
        description: `${newLeads.length} lead aggiunti con successo.`
      });
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il lead.",
        variant: "destructive"
      });
    } else {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const extractEmail = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead || !lead.website) return;

    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, emailStatus: 'extracting' as const } : l
    ));

    try {
      const response = await apiRequest("POST", "/api/extract-email", { url: lead.website });
      const result = await response.json();

      const newEmailStatus = result.email ? 'found' : 'not_found';
      
      await supabase
        .from('leads')
        .update({ email: result.email, email_status: newEmailStatus })
        .eq('id', id);

      setLeads(prev => prev.map(l => 
        l.id === id ? { ...l, email: result.email, emailStatus: newEmailStatus as Lead['emailStatus'] } : l
      ));

      if (result.email) {
        toast({
          title: "Email trovata",
          description: `${result.email}`
        });
      } else {
        toast({
          title: "Email non trovata",
          description: "Nessuna email trovata su questo sito.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setLeads(prev => prev.map(l => 
        l.id === id ? { ...l, emailStatus: 'error' as const } : l
      ));
      toast({
        title: "Errore",
        description: "Errore durante l'estrazione dell'email.",
        variant: "destructive"
      });
    }
  };

  const extractEmailsForSelected = async (ids: string[]) => {
    const leadsToProcess = leads.filter(l => ids.includes(l.id) && l.website);
    if (leadsToProcess.length === 0) return;

    setLeads(prev => prev.map(l => 
      ids.includes(l.id) ? { ...l, emailStatus: 'extracting' as const } : l
    ));

    toast({
      title: "Estrazione avviata",
      description: `Analisi di ${leadsToProcess.length} siti in corso...`
    });

    try {
      const websites = leadsToProcess.map(l => ({ id: l.id, url: l.website }));
      const response = await apiRequest("POST", "/api/extract-emails-batch", { websites });
      const { results } = await response.json();

      let foundCount = 0;
      for (const [leadId, result] of Object.entries(results as Record<string, any>)) {
        const newEmailStatus = result.email ? 'found' : 'not_found';
        if (result.email) foundCount++;
        
        await supabase
          .from('leads')
          .update({ email: result.email, email_status: newEmailStatus })
          .eq('id', leadId);

        setLeads(prev => prev.map(l => 
          l.id === leadId ? { ...l, email: result.email, emailStatus: newEmailStatus as Lead['emailStatus'] } : l
        ));
      }

      toast({
        title: "Estrazione completata",
        description: `Trovate ${foundCount} email su ${leadsToProcess.length} siti.`
      });
    } catch (error) {
      setLeads(prev => prev.map(l => 
        ids.includes(l.id) ? { ...l, emailStatus: 'error' as const } : l
      ));
      toast({
        title: "Errore",
        description: "Errore durante l'estrazione delle email.",
        variant: "destructive"
      });
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status } : lead
    ));

    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      fetchLeads();
      toast({
        title: "Errore aggiornamento",
        description: "Impossibile aggiornare lo stato.",
        variant: "destructive"
      });
    }
  };

  const toggleLeadSelection = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const newStatus = lead.status === 'selected' ? 'new' : 'selected';
    await updateLeadStatus(id, newStatus);
  };

  const selectedLeadsCount = leads.filter(l => l.status === 'selected').length;

  return (
    <AppContext.Provider value={{ 
      leads, 
      isLoading, 
      addLead, 
      addLeadsFromList,
      deleteLead,
      extractEmail,
      extractEmailsForSelected,
      updateLeadStatus, 
      toggleLeadSelection, 
      selectedLeadsCount,
      refreshLeads: fetchLeads
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

function extractNameFromUrl(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const hostname = new URL(normalized).hostname;
    const name = hostname.replace(/^www\./, '').split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return url;
  }
}
