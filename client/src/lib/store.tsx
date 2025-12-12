import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, LeadDB } from './supabase';
import { useToast } from "@/hooks/use-toast";

// Mappa il tipo Lead del frontend con quello del DB se necessario, 
// per ora usiamo una struttura compatibile ma adattata
export interface Lead {
  id: string;
  name: string;
  website: string;
  phone: string;
  address: string;
  email: string | null;
  source: 'website' | 'facebook' | 'maps' | 'manual';
  status: 'new' | 'selected' | 'sent' | 'archived';
  city?: string;
  category?: string;
}

interface AppContextType {
  leads: Lead[];
  isLoading: boolean;
  addLeads: (newLeads: Omit<Lead, 'id'>[]) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<void>;
  toggleLeadSelection: (id: string) => Promise<void>;
  selectedLeadsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch leads on mount
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
      // Mappa i campi DB ai campi frontend
      const mappedLeads: Lead[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.company_name,
        website: item.website || '',
        phone: item.phone || '',
        address: item.address || '',
        email: item.email,
        source: item.source,
        status: item.status,
        city: item.city,
        category: item.category
      }));
      setLeads(mappedLeads);
    }
    setIsLoading(false);
  };

  const addLeads = async (newLeads: Omit<Lead, 'id'>[]) => {
    // Preparazione dati per Supabase
    const leadsToInsert = newLeads.map(l => ({
      company_name: l.name,
      website: l.website,
      phone: l.phone,
      address: l.address,
      email: l.email,
      source: l.source,
      status: l.status,
      city: l.city || 'Sconosciuta', 
      category: l.category || 'Generale'
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('Error inserting leads:', error);
      toast({
        title: "Errore salvataggio",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      // Aggiorna lo stato locale
      const addedLeads: Lead[] = data.map((item: any) => ({
        id: item.id,
        name: item.company_name,
        website: item.website || '',
        phone: item.phone || '',
        address: item.address || '',
        email: item.email,
        source: item.source,
        status: item.status,
        city: item.city,
        category: item.category
      }));
      
      setLeads(prev => [...addedLeads, ...prev]);
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    // Ottimistic update
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status } : lead
    ));

    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      // Revert in case of error (simplified)
      fetchLeads();
      toast({
        title: "Errore aggiornamento",
        description: "Impossibile aggiornare lo stato sul server.",
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
    <AppContext.Provider value={{ leads, isLoading, addLeads, updateLeadStatus, toggleLeadSelection, selectedLeadsCount }}>
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
