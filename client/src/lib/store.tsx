import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Lead {
  id: string;
  name: string;
  website: string;
  phone: string;
  address: string;
  email: string | null;
  source: 'website' | 'facebook' | 'maps';
  status: 'new' | 'selected' | 'sent';
}

interface AppContextType {
  leads: Lead[];
  addLeads: (newLeads: Lead[]) => void;
  updateLeadStatus: (id: string, status: Lead['status']) => void;
  toggleLeadSelection: (id: string) => void;
  selectedLeadsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);

  const addLeads = (newLeads: Lead[]) => {
    setLeads(prev => {
      // Avoid duplicates based on name + address
      const existingIds = new Set(prev.map(l => l.name + l.address));
      const filteredNew = newLeads.filter(l => !existingIds.has(l.name + l.address));
      return [...filteredNew, ...prev];
    });
  };

  const updateLeadStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status } : lead
    ));
  };

  const toggleLeadSelection = (id: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;
      const newStatus = lead.status === 'selected' ? 'new' : 'selected';
      return { ...lead, status: newStatus };
    }));
  };

  const selectedLeadsCount = leads.filter(l => l.status === 'selected').length;

  return (
    <AppContext.Provider value={{ leads, addLeads, updateLeadStatus, toggleLeadSelection, selectedLeadsCount }}>
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
