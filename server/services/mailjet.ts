const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;

interface EmailRecipient {
  email: string;
  name: string;
}

interface SendEmailParams {
  sender: string;
  senderName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  recipients: EmailRecipient[];
}

interface SendResult {
  success: boolean;
  sentCount: number;
  errors: string[];
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  if (!MAILJET_API_KEY || !MAILJET_API_SECRET) {
    throw new Error("MAILJET_API_KEY o MAILJET_API_SECRET non configurati");
  }

  const messages = params.recipients.map((recipient) => ({
    From: {
      Email: params.sender,
      Name: params.senderName || "LeadFlow",
    },
    To: [
      {
        Email: recipient.email,
        Name: recipient.name,
      },
    ],
    Subject: params.subject,
    TextPart: params.textBody || stripHtml(params.htmlBody),
    HTMLPart: wrapWithUnsubscribe(params.htmlBody, recipient.email),
  }));

  const errors: string[] = [];
  let sentCount = 0;

  for (let i = 0; i < messages.length; i += 50) {
    const batch = messages.slice(i, i + 50);
    
    try {
      const response = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify({ Messages: batch }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`Batch ${i / 50 + 1}: ${response.status} - ${errorText}`);
      } else {
        const result = await response.json();
        sentCount += result.Messages?.filter((m: any) => m.Status === "success").length || batch.length;
      }
    } catch (err) {
      errors.push(`Batch ${i / 50 + 1}: ${err instanceof Error ? err.message : "Errore sconosciuto"}`);
    }
  }

  return {
    success: errors.length === 0,
    sentCount,
    errors,
  };
}

export async function sendTestEmail(
  sender: string,
  subject: string,
  body: string,
  testEmail: string
): Promise<boolean> {
  const result = await sendEmail({
    sender,
    subject: `[TEST] ${subject}`,
    htmlBody: body,
    recipients: [{ email: testEmail, name: "Test" }],
  });

  return result.success;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function wrapWithUnsubscribe(htmlBody: string, recipientEmail: string): string {
  const unsubscribeUrl = `mailto:unsubscribe@leadflow.app?subject=Unsubscribe&body=Rimuovi%20${encodeURIComponent(recipientEmail)}%20dalla%20lista`;
  
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; text-align: center;">
      <p>Questa email ti è stata inviata tramite LeadFlow.</p>
      <p>Se non vuoi più ricevere queste comunicazioni, <a href="${unsubscribeUrl}" style="color: #666;">clicca qui per disiscriverti</a>.</p>
    </div>
  `;
  
  if (htmlBody.includes("</body>")) {
    return htmlBody.replace("</body>", `${footer}</body>`);
  }
  
  return htmlBody + footer;
}
