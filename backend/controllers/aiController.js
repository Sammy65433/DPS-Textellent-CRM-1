const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash"];
const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(model, prompt, maxTokens, temperature, base64Data, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `${GEMINI_URL_BASE}/${model}:generateContent`;

  const parts = [{ text: prompt }];
  if (base64Data && mimeType) {
    parts.push({ inlineData: { mimeType, data: base64Data } });
  }

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });

  // Try X-goog-api-key first
  let response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
    body,
    signal: AbortSignal.timeout(25000),
  });

  // If auth key, try Authorization: Bearer as fallback
  if (!response.ok && apiKey.startsWith("AQ.") && (response.status === 400 || response.status === 401 || response.status === 403)) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body,
      signal: AbortSignal.timeout(25000),
    });
  }

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Gemini ${model} error:`, response.status, responseText.slice(0, 200));
    throw new Error(`Gemini API error ${response.status}: ${responseText.slice(0, 200)}`);
  }

  let data;
  try { data = JSON.parse(responseText); } catch {
    throw new Error("Invalid JSON response from Gemini: " + responseText.slice(0, 200));
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function geminiGenerate(prompt, maxTokens = 500, temperature = 0.7) {
  for (const model of GEMINI_MODELS) {
    try {
      console.log("Gemini request: model=" + model + ", keyPrefix=" + process.env.GEMINI_API_KEY.slice(0, 8) + "...");
      const text = await callGemini(model, prompt, maxTokens, temperature, null, null);
      if (text) return text;
    } catch (error) {
      console.error(`Model ${model} failed:`, error.message.slice(0, 100));
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw error;
    }
  }
  return "";
}

async function geminiVision(prompt, base64Data, mimeType, maxTokens = 500, temperature = 0.2) {
  for (const model of GEMINI_MODELS) {
    try {
      const text = await callGemini(model, prompt, maxTokens, temperature, base64Data, mimeType);
      if (text) return text;
    } catch (error) {
      console.error(`Model ${model} vision failed:`, error.message.slice(0, 100));
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw error;
    }
  }
  return "";
}

const DPS_SCOPE = "user123";

const CRM_SYSTEM_PROMPT = `You are DPS CRM Assistant, a helpful AI guide for the DPS Professional Tax Services CRM. You help staff members navigate the app and answer questions about how to use it.

The CRM has these pages (accessible from the sidebar):
- Dashboard: Overview of contacts, templates, messages, campaigns, and emails. Shows today's appointments, this week's bookings, recent messages/emails, and front-page booking messages from the website. Has quick actions and AI follow-up suggestions.
- Contacts: Manage client contacts. Add/edit/delete contacts. Send SMS messages and emails. View conversation history. Upload and download documents (if client account is linked). Send account-link invitations. AI search available.
- Templates: Create/manage message and email templates with {{firstName}} and {{lastName}} placeholders.
- Campaigns: Create and send campaigns to selected contacts. Email-only or SMS. Can schedule campaigns. AI copy generator available.
- Emails: View and send emails to contacts. Can use templates.
- Messages: View SMS conversation history. Send individual SMS messages.
- Analytics: Booking counts, contact stats, outreach trends.
- Booking: Full calendar view (day/week/month). Create, edit, and cancel appointments. Color-coded by preparer (Pierre=blue, Dalia=purple, Severe=green, Jean=orange, Ricot=pink). Real estate appointments show in teal (DPS Realty). AI scheduling available.
- Staff Management (admin only): Invite new staff, deactivate/reactivate accounts.

Key features:
- Staff invite: Admin goes to Staff Management, enters name + email, sends invitation. Staff receives email with setup link, sets password, account becomes active.
- Client account linking: Staff clicks "Connect client account" on a contact (by email match) OR sends an invitation email. Client signs up on DPS site, confirms email, then connects via invitation link.
- Document upload: Clients upload docs on DPS site portal. Staff downloads from contact's Documents tab. AI can extract data from uploaded documents.
- Front-page booking messages: Messages from website booking forms appear on dashboard. Staff can delete them (with confirmation + audit log).
- Birthday emails: Automatic daily birthday greetings sent at 9 AM ET. Staff can trigger manually via POST /api/birthdays/run.
- Mock SMS mode: When MOCK_SMS=true, SMS are logged but not actually sent (for testing).

When answering, be concise, friendly, and specific. Reference exact page names and button labels. If you don't know something, say so. Never make up features that don't exist.`;
export async function chatWithAssistant(req, res) {
  const { message, context } = req.body ?? {};

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 chars)." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured. Set GEMINI_API_KEY in environment." });
  }

  try {
    const contextStr = context
      ? `\n\nCurrent context: The user is on the "${context.page || "unknown"}" page. ${context.selectedContact ? `Selected contact: ${context.selectedContact.firstName} ${context.selectedContact.lastName} (${context.selectedContact.email}).` : ""} ${context.role ? `User role: ${context.role}.` : ""}`
      : "";

    const text = await geminiGenerate(
      CRM_SYSTEM_PROMPT + contextStr + "\n\nUser question: " + message.trim(),
      500,
      0.7
    );

    return res.json({ reply: text || "I couldn't generate a response. Please try again." });
  } catch (error) {
    console.error("AI chat failed:", error);
    return res.status(500).json({ error: "AI assistant is temporarily unavailable. " + error.message });
  }
}

export async function generateContactSummary(req, res) {
  const { contact, messages = [], emails = [] } = req.body ?? {};

  if (!contact) {
    return res.status(400).json({ error: "Contact data is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const recentMsgs = messages.slice(0, 5).map((m) => `${m.direction}: ${m.body}`).join("\n");
    const recentEmails = emails.slice(0, 5).map((e) => `Subject: ${e.subject}`).join("\n");

    const prompt = `You are a CRM assistant. Summarize this contact in 2-3 sentences for a staff member preparing to reach out. Be concise and helpful.

Contact: ${contact.firstName} ${contact.lastName}
Email: ${contact.email || "none"}
Phone: ${contact.phone || "none"}
Tags: ${contact.tags || "none"}
Notes: ${contact.notes || "none"}
Birthday: ${contact.birthday ? new Date(contact.birthday).toLocaleDateString() : "not set"}

Recent messages:
${recentMsgs || "none"}

Recent emails:
${recentEmails || "none"}

Provide a brief, professional summary highlighting key facts and any suggested follow-up actions.`;

    const text = await geminiGenerate(prompt, 200, 0.5);
    return res.json({ summary: text || "No summary available." });
  } catch (error) {
    console.error("Contact summary failed:", error);
    return res.status(500).json({ error: "Could not generate summary. " + error.message });
  }
}

export async function generateCampaignCopy(req, res) {
  const { audience, goal, tone } = req.body ?? {};

  if (!goal || typeof goal !== "string") {
    return res.status(400).json({ error: "Campaign goal is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const prompt = `You are a marketing copywriter for DPS Professional Tax Services, a tax preparation and real estate services company in Maplewood, NJ.

Write a short campaign message (SMS or email) for the following:
- Audience: ${audience || "CRM contacts"}
- Goal: ${goal}
- Tone: ${tone || "professional and friendly"}

Return ONLY a JSON object with two fields:
- "subject": a short email subject line (max 60 chars)
- "body": the message body (max 300 chars for SMS, or up to 500 for email). Use {{firstName}} placeholder for personalization.

Do not include any explanation or markdown. Just the JSON.`;

    const text = await geminiGenerate(prompt, 300, 0.8);
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.json({ subject: parsed.subject, body: parsed.body });
    } catch {
      return res.json({ subject: "DPS Update", body: text });
    }
  } catch (error) {
    console.error("Campaign copy generation failed:", error);
    return res.status(500).json({ error: "Could not generate campaign copy. " + error.message });
  }
}

export async function naturalLanguageSearch(req, res) {
  const { query, contacts } = req.body ?? {};

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required." });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.json({ matchedIds: [], explanation: "No contacts to search." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const contactList = contacts.map((c) => ({
      id: c._id || c.id,
      name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
      email: c.email || "",
      phone: c.phone || "",
      tags: c.tags || "",
      notes: c.notes || "",
    }));

    const prompt = `You are a CRM search assistant. Given a natural language query, return the IDs of contacts that match.

Contacts (JSON):
${JSON.stringify(contactList, null, 1)}

Query: "${query.trim()}"

Return ONLY a JSON object: { "matchedIds": ["id1", "id2", ...], "explanation": "brief reason" }
If no contacts match, return { "matchedIds": [], "explanation": "No matching contacts found." }
Do not include markdown or explanation outside the JSON.`;

    const text = await geminiGenerate(prompt, 500, 0.2);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({
        matchedIds: Array.isArray(parsed.matchedIds) ? parsed.matchedIds : [],
        explanation: parsed.explanation || "",
      });
    } catch {
      return res.json({ matchedIds: [], explanation: text });
    }
  } catch (error) {
    console.error("Natural language search failed:", error);
    return res.status(500).json({ error: "Search failed. " + error.message });
  }
}

export async function smartFollowUps(req, res) {
  const { contacts, messages = [], emails = [] } = req.body ?? {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.json({ suggestions: [] });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const now = new Date().toISOString().slice(0, 10);
    const contactSummary = contacts.slice(0, 50).map((c) => {
      const msgs = messages.filter((m) => String(m.contactId?._id || m.contactId) === String(c._id));
      const ems = emails.filter((e) => String(e.contactId?._id || e.contactId) === String(c._id));
      const lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
      const lastEmail = ems.length ? ems[ems.length - 1] : null;
      const lastActivity = [lastMsg?.createdAt, lastEmail?.createdAt].filter(Boolean).sort().pop();
      const daysSince = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
        : null;

      return {
        id: c._id || c.id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        email: c.email || "",
        phone: c.phone || "",
        tags: c.tags || "",
        hasEmail: !!c.email,
        hasPhone: !!c.phone,
        daysSinceContact: daysSince,
        msgCount: msgs.length,
        emailCount: ems.length,
      };
    });

    const prompt = `You are a CRM follow-up advisor for DPS Professional Tax Services. Today is ${now}.

Analyze these contacts and suggest up to 5 follow-up actions. Consider: contacts not contacted in 14+ days, contacts missing email/phone, contacts with no recent activity, contacts tagged as leads, etc.

Contacts:
${JSON.stringify(contactSummary, null, 1)}

Return ONLY a JSON array of suggestions (max 5):
[{ "contactId": "id", "contactName": "name", "reason": "why follow up", "suggestedAction": "what to do", "priority": "high|medium|low" }]

If no suggestions, return []. No markdown, just JSON.`;

    const text = await geminiGenerate(prompt, 600, 0.6);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ suggestions: Array.isArray(parsed) ? parsed : [] });
    } catch {
      return res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Smart follow-ups failed:", error);
    return res.status(500).json({ error: "Follow-up analysis failed. " + error.message });
  }
}

export async function aiScheduleAppointment(req, res) {
  const { request, availableSlots, preparers, services } = req.body ?? {};

  if (!request || typeof request !== "string") {
    return res.status(400).json({ error: "Scheduling request is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `You are a scheduling assistant for DPS Professional Tax Services. Today is ${today}.

Staff request: "${request}"

Available preparers: ${JSON.stringify(preparers || ["Pierre Polidor", "Dalia Pierre", "Severe Jacquet", "Jean P Cifrant", "Ricot Casimir"])}
Available services: ${JSON.stringify(services || ["Tax Consultation", "Personal Tax Preparation", "Business Tax Preparation", "Notary Public", "Form Preparation Support"])}
Available time slots (if provided): ${JSON.stringify(availableSlots || [])}

Parse the request and return ONLY a JSON object:
{ "clientName": "name if mentioned", "service": "service name", "preparer": "preparer name", "date": "YYYY-MM-DD", "time": "H:MM AM/PM", "duration": 60, "visitFormat": "in_person|phone|virtual", "notes": "any extra info" }

If a field can't be determined, use null. Do not include markdown or explanation.`;

    const text = await geminiGenerate(prompt, 300, 0.3);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ suggestion: parsed });
    } catch {
      return res.json({ suggestion: null, raw: text });
    }
  } catch (error) {
    console.error("AI scheduling failed:", error);
    return res.status(500).json({ error: "Scheduling analysis failed. " + error.message });
  }
}

export async function extractDocumentData(req, res) {
  const { documentId, contactId } = req.body ?? {};

  if (!documentId || !contactId) {
    return res.status(400).json({ error: "Document ID and contact ID are required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const Contact = (await import("../models/Contact.js")).default;
    const contact = await Contact.findOne({ _id: contactId, userId: "user123" }).select("+supabaseCustomerId");

    if (!contact || !contact.supabaseCustomerId) {
      return res.status(404).json({ error: "Contact not found or not linked to a client account." });
    }

    const customerId = contact.supabaseCustomerId;

    const fileResponse = await fetch(
      `${process.env.DPS_API_URL}/api/staff/documents/${encodeURIComponent(customerId)}/${encodeURIComponent(documentId)}/download`,
      {
        headers: { "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY },
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!fileResponse.ok) {
      return res.status(404).json({ error: "Document not found." });
    }

    const mimeType = fileResponse.headers.get("content-type") || "application/pdf";
    const buffer = await fileResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      return res.status(400).json({ error: "Only images and PDFs can be processed." });
    }

    const prompt = `You are a document data extraction assistant for a tax preparation office. Extract the following information from this intake form/document:

- First name
- Last name
- Date of birth (YYYY-MM-DD)
- Phone number
- Email address
- Address (street, city, state, zip)
- Filing status (single, married, head of household, etc.)
- Income types mentioned (W-2, 1099, self-employment, rental, etc.)
- Number of dependents
- Any notes or special requests

Return ONLY a JSON object with these fields (use null for missing info):
{ "firstName": "", "lastName": "", "dateOfBirth": "", "phone": "", "email": "", "address": "", "city": "", "state": "", "zip": "", "filingStatus": "", "incomeTypes": [], "dependents": null, "notes": "" }

Do not include markdown or explanation. Just the JSON.`;

    const text = await geminiVision(prompt, base64, mimeType, 500, 0.2);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ extracted: parsed });
    } catch {
      return res.json({ extracted: { raw: text } });
    }
  } catch (error) {
    console.error("Document extraction failed:", error);
    return res.status(500).json({ error: "Document extraction failed. " + error.message });
  }
}