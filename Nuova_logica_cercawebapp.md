# Nuova Logica CercaWebApp

## Obiettivo
Estrarre email di contatto dai siti web inseriti manualmente dall'utente.

## Flusso di lavoro

### Step 1: Inserimento Dati (Manuale - Utente)
L'utente inserisce i dati delle attività:
- Nome attività
- URL del sito web
- Città (opzionale)
- Categoria (opzionale)

**Modalità di inserimento:**
- Singolo: form con campi per una singola attività
- Massivo: upload CSV o copia/incolla lista di URL

### Step 2: Estrazione Email (Automatico - App)
Per ogni sito web inserito, l'app:
1. Visita la homepage usando Zyte API
2. Cerca email nella pagina
3. Se non trova email, visita pagine comuni:
   - /contatti
   - /contact
   - /chi-siamo
   - /about
4. Estrae e filtra le email trovate

### Step 3: Gestione Lead
L'utente può:
- Visualizzare tutti i lead con le email estratte
- Selezionare i lead per campagne email
- Esportare in CSV

### Step 4: Invio Email (Futuro)
Integrazione con servizio email (SendGrid/Resend) per:
- Creare template email
- Inviare campagne ai lead selezionati

---

## Struttura Dati

### Lead (Input utente)
```
{
  id: string
  name: string          // Nome attività
  website: string       // URL sito web (obbligatorio)
  city?: string         // Città (opzionale)
  category?: string     // Categoria (opzionale)
}
```

### Lead (Dopo estrazione)
```
{
  id: string
  name: string
  website: string
  email: string | null  // Email estratta
  emailStatus: "pending" | "found" | "not_found" | "error"
  city?: string
  category?: string
  status: "new" | "selected" | "sent"
}
```

---

## API Endpoints

### POST /api/leads
Aggiunge uno o più lead (inserimento manuale)
```
Body: { leads: [{ name, website, city?, category? }] }
```

### POST /api/leads/extract-emails
Avvia estrazione email per lead in stato "pending"
```
Body: { leadIds: string[] }
```

### GET /api/leads
Restituisce tutti i lead

### DELETE /api/leads/:id
Elimina un lead

### POST /api/leads/import-csv
Importa lead da file CSV

---

## Funzionalità Zyte

### Estrazione Email
```javascript
async function extractEmailFromWebsite(url) {
  // 1. Fetch homepage
  const html = await fetchWithZyte(url, true)
  
  // 2. Cerca email
  let emails = extractEmailsFromHtml(html)
  
  // 3. Se non trova, prova pagine contatti
  if (emails.length === 0) {
    const contactPages = ['/contatti', '/contact', '/chi-siamo', '/about']
    for (const page of contactPages) {
      const pageHtml = await fetchWithZyte(url + page, false)
      emails = extractEmailsFromHtml(pageHtml)
      if (emails.length > 0) break
    }
  }
  
  return emails[0] || null
}
```

### Filtro Email
- Esclude: noreply@, no-reply@, example@, test@, wixpress, sentry, cloudflare
- Priorità: info@, contatti@, booking@, prenotazioni@, amministrazione@

---

## Interfaccia Utente

### Pagina Principale
1. **Form inserimento singolo**
   - Campo nome attività
   - Campo URL sito web (obbligatorio)
   - Pulsante "Aggiungi"

2. **Inserimento massivo**
   - Area testo per incollare lista URL
   - Upload file CSV
   - Pulsante "Importa"

3. **Lista Lead**
   - Tabella con: Nome, Sito, Email, Stato
   - Checkbox per selezione multipla
   - Pulsante "Estrai Email" per lead selezionati

4. **Azioni**
   - Esporta CSV
   - Elimina selezionati
   - Prepara campagna email

---

## Vantaggi di questa logica

1. **Niente scraping Google Maps** - L'utente ha già i dati
2. **Semplicità** - Focus solo su estrazione email
3. **Affidabilità** - Meno punti di fallimento
4. **Flessibilità** - L'utente può inserire dati da qualsiasi fonte
5. **Controllo** - L'utente sceglie quali siti analizzare
