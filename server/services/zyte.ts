import { randomUUID } from "crypto";

const ZYTE_API_KEY = process.env.ZYTE_API_KEY;
const ZYTE_API_URL = "https://api.zyte.com/v1/extract";

interface Business {
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
}

interface Lead {
  id: string;
  name: string;
  website: string;
  phone: string;
  address: string;
  email: string | null;
  source: "website" | "maps" | "facebook" | "manual";
  status: "new" | "selected" | "sent" | "archived";
  city: string;
  category: string;
}

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

function extractBusinessesFromMapsHtml(html: string): Business[] {
  const businesses: Business[] = [];
  
  const nameRegex = /<div[^>]*class="[^"]*qBF1Pd[^"]*"[^>]*>([^<]+)<\/div>/gi;
  const websiteRegex = /href="(https?:\/\/[^"]+)"[^>]*data-value="Website"/gi;
  const phoneRegex = /(\+39[\s]?[\d\s]{8,15}|\d{2,4}[\s.-]?\d{6,10})/g;
  
  const nameMatches = html.match(/<div[^>]*class="[^"]*fontHeadlineSmall[^"]*"[^>]*>([^<]+)<\/div>/gi) || [];
  
  for (const match of nameMatches) {
    const nameClean = match.replace(/<[^>]+>/g, "").trim();
    if (nameClean && nameClean.length > 2) {
      businesses.push({
        name: nameClean,
        website: null,
        phone: null,
        address: null,
      });
    }
  }

  const linkMatches = [...html.matchAll(/href="([^"]+)"[^>]*aria-label="Sito[^"]*"/gi)];
  linkMatches.forEach((m, i) => {
    if (businesses[i]) {
      businesses[i].website = m[1];
    }
  });

  return businesses;
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
  ];

  const preferredPatterns = [
    /^info@/i,
    /^contatti@/i,
    /^booking@/i,
    /^prenotazioni@/i,
    /^amministrazione@/i,
    /^direzione@/i,
  ];

  const filteredEmails = [...new Set(emails)].filter((email) => {
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

export async function searchBusinesses(
  city: string,
  category: string,
  onProgress?: (message: string, percent: number) => void
): Promise<Lead[]> {
  const leads: Lead[] = [];
  
  try {
    onProgress?.("Ricerca attività su Google Maps...", 10);
    
    const searchQuery = encodeURIComponent(`${category} ${city} Italia`);
    const mapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
    
    const mapsHtml = await fetchWithZyte(mapsUrl, true);
    onProgress?.("Analisi risultati Google Maps...", 30);
    
    const businesses = extractBusinessesFromMapsHtml(mapsHtml);
    
    if (businesses.length === 0) {
      const fallbackBusinesses = extractBusinessesFallback(mapsHtml, city, category);
      businesses.push(...fallbackBusinesses);
    }
    
    onProgress?.(`Trovate ${businesses.length} attività. Estrazione email...`, 50);
    
    let processed = 0;
    for (const business of businesses.slice(0, 15)) {
      processed++;
      const percent = 50 + Math.floor((processed / Math.min(businesses.length, 15)) * 40);
      
      let email: string | null = null;
      
      if (business.website) {
        try {
          onProgress?.(`Analisi sito: ${business.name}...`, percent);
          const siteHtml = await fetchWithZyte(business.website, true);
          const emails = extractEmailsFromHtml(siteHtml);
          if (emails.length > 0) {
            email = emails[0];
          }
          
          if (!email) {
            const contactUrls = ["/contatti", "/contact", "/contacts", "/chi-siamo"];
            for (const path of contactUrls) {
              try {
                const contactUrl = new URL(path, business.website).href;
                const contactHtml = await fetchWithZyte(contactUrl, false);
                const contactEmails = extractEmailsFromHtml(contactHtml);
                if (contactEmails.length > 0) {
                  email = contactEmails[0];
                  break;
                }
              } catch {
              }
            }
          }
        } catch (err) {
          console.error(`Errore scraping ${business.website}:`, err);
        }
      }

      leads.push({
        id: randomUUID(),
        name: business.name,
        website: business.website || "",
        phone: business.phone || "",
        address: business.address || "",
        email,
        source: business.website ? "website" : "maps",
        status: "new",
        city,
        category,
      });
    }
    
    onProgress?.("Completato!", 100);
    
  } catch (error) {
    console.error("Errore nella ricerca:", error);
    throw error;
  }
  
  return leads;
}

function extractBusinessesFallback(html: string, city: string, category: string): Business[] {
  const businesses: Business[] = [];
  
  const patterns = [
    /"title":"([^"]+)"/g,
    /aria-label="([^"]+)"/g,
    /<h3[^>]*>([^<]+)<\/h3>/gi,
  ];
  
  const names = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      if (
        name.length > 3 &&
        name.length < 100 &&
        !name.includes("Google") &&
        !name.includes("Maps") &&
        !name.includes("Cerca")
      ) {
        names.add(name);
      }
    }
  }
  
  const urlPattern = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
  const urls = [...html.matchAll(urlPattern)]
    .map((m) => m[0])
    .filter((url) => !url.includes("google") && !url.includes("gstatic"));
  
  let i = 0;
  for (const name of [...names].slice(0, 20)) {
    businesses.push({
      name,
      website: urls[i] || null,
      phone: null,
      address: `${city}, Italia`,
    });
    i++;
  }
  
  return businesses;
}
