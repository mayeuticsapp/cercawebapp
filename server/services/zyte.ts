import { randomUUID } from "crypto";

const ZYTE_API_KEY = process.env.ZYTE_API_KEY;
const ZYTE_API_URL = "https://api.zyte.com/v1/extract";

async function fetchWithZyte(url: string, browserHtml = true): Promise<string> {
  if (!ZYTE_API_KEY) {
    throw new Error("ZYTE_API_KEY non configurata");
  }

  const response = await fetch(ZYTE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(ZYTE_API_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      url,
      browserHtml,
      httpResponseBody: !browserHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zyte API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.browserHtml || Buffer.from(data.httpResponseBody || "", "base64").toString("utf-8");
}

function extractEmailsFromHtml(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
  const emails = html.match(emailRegex) || [];
  
  const excludePatterns = [
    /noreply@/i,
    /no-reply@/i,
    /example@/i,
    /test@/i,
    /sample@/i,
    /@example\./i,
    /@test\./i,
    /wixpress/i,
    /sentry/i,
    /cloudflare/i,
    /google/i,
    /facebook/i,
    /twitter/i,
    /instagram/i,
    /youtube/i,
    /schema\.org/i,
    /w3\.org/i,
    /placeholder/i,
    /your-?email/i,
    /email@/i,
  ];

  const preferredPatterns = [
    /^info@/i,
    /^contatti@/i,
    /^booking@/i,
    /^prenotazioni@/i,
    /^amministrazione@/i,
    /^direzione@/i,
    /^contact@/i,
    /^hello@/i,
    /^sales@/i,
  ];

  const filteredEmails = Array.from(new Set(emails)).filter((email) => {
    return !excludePatterns.some((pattern) => pattern.test(email));
  });

  filteredEmails.sort((a, b) => {
    const aPreferred = preferredPatterns.some((p) => p.test(a));
    const bPreferred = preferredPatterns.some((p) => p.test(b));
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return 0;
  });

  return filteredEmails;
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  try {
    const urlObj = new URL(normalized);
    return urlObj.href;
  } catch {
    return normalized;
  }
}

export interface ExtractEmailResult {
  url: string;
  email: string | null;
  error?: string;
}

export async function extractEmailFromWebsite(websiteUrl: string): Promise<ExtractEmailResult> {
  const url = normalizeUrl(websiteUrl);
  
  try {
    console.log(`[Zyte] Analisi homepage: ${url}`);
    const html = await fetchWithZyte(url, true);
    let emails = extractEmailsFromHtml(html);
    
    if (emails.length > 0) {
      console.log(`[Zyte] Email trovata su homepage: ${emails[0]}`);
      return { url, email: emails[0] };
    }
    
    const contactPaths = ['/contatti', '/contact', '/contacts', '/chi-siamo', '/about', '/about-us', '/contattaci'];
    
    for (const path of contactPaths) {
      try {
        const contactUrl = new URL(path, url).href;
        console.log(`[Zyte] Provo pagina contatti: ${contactUrl}`);
        const contactHtml = await fetchWithZyte(contactUrl, false);
        emails = extractEmailsFromHtml(contactHtml);
        
        if (emails.length > 0) {
          console.log(`[Zyte] Email trovata su ${path}: ${emails[0]}`);
          return { url, email: emails[0] };
        }
      } catch (err) {
        // Pagina non trovata, continua
      }
    }
    
    console.log(`[Zyte] Nessuna email trovata per: ${url}`);
    return { url, email: null };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    console.error(`[Zyte] Errore per ${url}:`, errorMessage);
    return { url, email: null, error: errorMessage };
  }
}

export async function extractEmailsFromWebsites(
  websites: { id: string; url: string }[],
  onProgress?: (current: number, total: number, url: string) => void
): Promise<Map<string, ExtractEmailResult>> {
  const results = new Map<string, ExtractEmailResult>();
  
  for (let i = 0; i < websites.length; i++) {
    const { id, url } = websites[i];
    onProgress?.(i + 1, websites.length, url);
    
    const result = await extractEmailFromWebsite(url);
    results.set(id, result);
    
    // Piccola pausa per non sovraccaricare l'API
    if (i < websites.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}
