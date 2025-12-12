import { Lead } from "./store";

export const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Ristorante Da Mario",
    website: "www.damario-roma.it",
    phone: "+39 06 12345678",
    address: "Via del Corso 12, Roma",
    email: "info@damario-roma.it",
    source: "website",
    status: "new"
  },
  {
    id: "2",
    name: "Pizzeria La Bella Napoli",
    website: "www.labellanapoli.com",
    phone: "+39 06 87654321",
    address: "Piazza Navona 4, Roma",
    email: "prenotazioni@labellanapoli.com",
    source: "maps",
    status: "new"
  },
  {
    id: "3",
    name: "Trattoria Romana",
    website: "www.trattoriaromana.it",
    phone: "+39 06 11223344",
    address: "Via Condotti 55, Roma",
    email: null,
    source: "website",
    status: "new"
  },
  {
    id: "4",
    name: "Osteria del Gusto",
    website: "www.osteriadelgusto.it",
    phone: "+39 06 99887766",
    address: "Via Veneto 10, Roma",
    email: "contatti@osteriadelgusto.it",
    source: "facebook",
    status: "new"
  },
  {
    id: "5",
    name: "Sushi Zen",
    website: "www.sushizen-roma.com",
    phone: "+39 06 55443322",
    address: "Via Nazionale 20, Roma",
    email: "info@sushizen-roma.com",
    source: "website",
    status: "new"
  }
];
