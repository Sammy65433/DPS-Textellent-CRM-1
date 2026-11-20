const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

async function getAvailableModels(apiKey) {
  try {
    const response = await fetch(GROQ_MODELS_URL, {
      headers: { "Authorization": `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    const all = (data.data || []).map((m) => m.id);
    console.log("All Groq models:", all.join(", "));

    // Prioritize chat/text models, exclude TTS, guard, whisper, etc.
    const chatModels = all.filter((id) => {
      const lower = id.toLowerCase();
      if (lower.includes("whisper") || lower.includes("tts") || lower.includes("guard") ||
          lower.includes("compound") || lower.includes("orpheus") || lower.includes("allam")) {
        return false;
      }
      return lower.includes("gpt") || lower.includes("llama") || lower.includes("qwen") ||
             lower.includes("gemma") || lower.includes("mixtral") || lower.includes("deepseek");
    });

    // Sort: prefer gpt-oss-20b (fastest), then qwen, then others
    const priority = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
    const sorted = [
      ...priority.filter((m) => chatModels.includes(m)),
      ...chatModels.filter((m) => !priority.includes(m)),
    ];

    return sorted.length > 0 ? sorted : chatModels;
  } catch (error) {
    console.error("Failed to fetch available models:", error.message);
    return [];
  }
}

async function groqGenerate(prompt, maxTokens = 500, temperature = 0.7) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  // Fetch available models dynamically
  let models = await getAvailableModels(apiKey);
  if (models.length === 0) {
    models = ["llama-3.3-70b-versatile"];
  }
  console.log("Available Groq models:", models.join(", "));

  for (const model of models) {
    try {
      console.log("Groq request: model=" + model);

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(25000),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Groq ${model} error:`, response.status, responseText.slice(0, 200));
        continue; // Try next model
      }

      let data;
      try { data = JSON.parse(responseText); } catch {
        console.error("Invalid JSON from Groq:", responseText.slice(0, 200));
        continue;
      }

      const text = data?.choices?.[0]?.message?.content || "";
      if (text) return text;
    } catch (error) {
      console.error(`Model ${model} failed:`, error.message.slice(0, 100));
    }
  }
  return "I'm currently experiencing high demand. Please try again in a few moments.";
}

const DPS_SCOPE = "user123";

const CRM_SYSTEM_PROMPT = `You are DPS CRM Assistant, a helpful AI guide for the DPS Professional Tax Services CRM. You help staff members navigate the app and answer questions about how to use it.

The CRM has these pages (accessible from the sidebar):
- Dashboard: Overview of contacts, templates, messages, campaigns, and emails. Shows today's appointments, this week's bookings, recent messages/emails, and front-page booking messages from the website. Has quick actions and AI follow-up suggestions.
- Contacts: Manage client contacts. Add/edit/delete contacts. Send SMS messages and emails. View conversation history. Upload and download documents (if client account is linked). Send account-link invitations. AI search available.
- Templates: Create/manage message and email templates with {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}}, {{companyEmail}}, {{companyAddress}}, {{companyWebsite}} placeholders. Templates can be edited after creation.
- Campaigns: Create and send campaigns to selected contacts. Email-only or SMS. Can schedule campaigns. AI copy generator available. Campaign message body can be edited directly.
- Emails: View and send emails to contacts. Can use templates. AI Generate Email and Suggest Replies available.
- Media Library: Upload and manage media files (images, PDFs) for use in campaigns/emails. Accessible from the sidebar (Media).
- Drip Campaigns: Create timed email sequences (drips) with multiple steps. Each step has a delay (days), subject, and body. Use {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, etc. placeholders. Enroll contacts with email addresses. The scheduler sends emails automatically in the background every minute based on each step's delay. AI Generate per step (type a goal, AI drafts subject+body) and a template selector per step. Steps: delay 0 = send immediately on enrollment; then 3-7 days for follow-ups. Accessible from sidebar (Drip Campaigns).
- Contacts: Now supports CSV import (Import CSV button), contact lists (filter by list), and custom fields on each contact. AI summary can be saved to notes.
- Analytics: Booking trends, contact growth, outreach activity, AI Revenue Insights.
- Messages: View SMS conversation history. Send individual SMS messages.
- Analytics: Booking counts, contact stats, outreach trends.
- Booking: Full calendar view (day/week/month). Create, edit, and cancel appointments. Color-coded by preparer (Pierre=blue, Dalia=purple, Severe=green, Jean=orange, Ricot=pink). Real estate appointments show in teal (DPS Realty). AI scheduling available.
- Staff Management (admin only): Invite new staff, deactivate/reactivate accounts.

Key features:
- Staff invite: Admin goes to Staff Management, enters name + email, sends invitation. Staff receives email with setup link, sets password, account becomes active.
- Client account linking: Staff clicks "Connect client account" on a contact (by email match) OR sends an invitation email. Client signs up on DPS site, confirms email, then connects via invitation link.
- Document upload: Clients upload docs on DPS site portal. Staff downloads from contact's Documents tab.
- Front-page booking messages: Messages from website booking forms appear on dashboard. Staff can delete them (with confirmation + audit log).
- Birthday emails: Automatic daily birthday greetings sent at 9 AM ET. Staff can trigger manually via POST /api/birthdays/run.
- Mock SMS mode: When MOCK_SMS=true, SMS are logged but not actually sent (for testing).
- CSV import: Staff can bulk-import contacts from a CSV file (must include a phone column). Duplicates by phone are skipped.
- Contact lists: Group contacts into named lists and filter by list.
- Custom fields: Add arbitrary key/value fields to any contact.
- Media library: Upload images/PDFs (max 5MB) and reference them by URL in emails/campaigns.
- Drip campaigns: Multi-step timed email sequences with auto-enrollment and background sending.
- AI summaries: Contact and email-thread AI summaries can be saved to notes (Save to Notes button).
- Drip campaigns: Multi-step timed email sequences. Create steps with delays, subjects, bodies. Enroll contacts. Scheduler runs every minute. AI generate per step + template selector. Test on yourself first.

When answering, be concise, friendly, and specific. Reference exact page names and button labels. If you don't know something, say so. Never make up features that don't exist.`;
export async function chatWithAssistant(req, res) {
  const { message, context } = req.body ?? {};

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 chars)." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured. Set GROQ_API_KEY in environment." });
  }

  try {
    const contextStr = context
      ? `\n\nCurrent context: The user is on the "${context.page || "unknown"}" page. ${context.selectedContact ? `Selected contact: ${context.selectedContact.firstName} ${context.selectedContact.lastName} (${context.selectedContact.email}).` : ""} ${context.role ? `User role: ${context.role}.` : ""}`
      : "";

    const text = await groqGenerate(
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

  if (!process.env.GROQ_API_KEY) {
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

    const text = await groqGenerate(prompt, 200, 0.5);
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

  if (!process.env.GROQ_API_KEY) {
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
- "body": the message body (max 300 chars for SMS, or up to 500 for email). Use {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}}, {{companyEmail}}, {{companyAddress}}, {{companyWebsite}} placeholders where appropriate for personalization.

Company info (use when relevant): DPS Professional Tax Services, Trusted tax and support services in Maplewood, NJ. 1811 Springfield Ave, Maplewood, NJ. Phone: (973) 327-2340. Emails: info@DPStaxpro.com, DpsTax1@gmail.com. Website: https://www.dpstaxpro.com.

Do not include any explanation or markdown. Just the JSON.`;

    const text = await groqGenerate(prompt, 300, 0.8);
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

  if (!process.env.GROQ_API_KEY) {
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

    const text = await groqGenerate(prompt, 500, 0.2);
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

  if (!process.env.GROQ_API_KEY) {
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

Analyze these contacts and suggest up to 5 follow-up actions. Consider: contacts not contacted in 14+ days, contacts missing email/phone, contacts with no recent activity, contacts tagged as leads, clients who have never scheduled an appointment, clients who have not returned this tax season (no recent bookings), and clients who signed up but never booked. Suggest re-engagement outreach for dormant clients.

Contacts:
${JSON.stringify(contactSummary, null, 1)}

Return ONLY a JSON array of suggestions (max 5):
[{ "contactId": "id", "contactName": "name", "reason": "why follow up", "suggestedAction": "what to do", "priority": "high|medium|low" }]

If no suggestions, return []. No markdown, just JSON.`;

    const text = await groqGenerate(prompt, 600, 0.6);
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

  if (!process.env.GROQ_API_KEY) {
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
{ "clientName": "name if mentioned", "service": "service name (default to 'Tax Consultation' if not specified)", "preparer": "preparer name or null if not specified", "date": "YYYY-MM-DD", "time": "H:MM AM/PM or null if not specified", "duration": 60, "visitFormat": "in_person|phone|virtual (default in_person)", "notes": "any extra info" }

If a field can't be determined, use null. Do not include markdown or explanation.`;

    const text = await groqGenerate(prompt, 300, 0.3);
    let parsed = null;
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract a JSON object from the text
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
      }
    }
    if (parsed && typeof parsed === "object") {
      return res.json({ suggestion: parsed });
    }
    return res.json({ suggestion: null, raw: text });
  } catch (error) {
    console.error("AI scheduling failed:", error);
    return res.status(500).json({ error: "Scheduling analysis failed. " + error.message });
  }
}

export async function extractDocumentData(req, res) {
  return res.json({
    extracted: {
      message: "Document OCR requires a vision-capable model. Groq text models don't support image processing. Please review the document manually or use a vision-capable provider.",
    },
  });
}
export async function smartReplySuggestions(req, res) {
  const { contact, messages = [] } = req.body ?? {};

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const recentMsgs = messages.slice(-6).map((m) => `${m.direction}: ${m.body}`).join("\n");
    const name = contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() : "the client";

    const prompt = `You are a CRM assistant for DPS Professional Tax Services. Suggest 3 short reply messages a staff member could send to this client. Keep each under 160 characters (SMS-friendly). Be professional and helpful.

Client: ${name}
${contact?.email ? `Email: ${contact.email}` : ""}
${contact?.phone ? `Phone: ${contact.phone}` : ""}

Recent conversation:
${recentMsgs || "No messages yet."}

Return ONLY a JSON array of 3 strings (the suggested replies). No markdown, just JSON.
Example: ["Thanks for reaching out! We'll get back to you shortly.", "Your documents have been received. We'll review them by Friday.", "Let's schedule a follow-up call. What time works for you?"]`;

    const text = await groqGenerate(prompt, 300, 0.7);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ suggestions: Array.isArray(parsed) ? parsed : [] });
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return res.json({ suggestions: Array.isArray(parsed) ? parsed : [] });
        } catch { /* fall through */ }
      }
      return res.json({ suggestions: [text] });
    }
  } catch (error) {
    console.error("Smart reply failed:", error);
    return res.status(500).json({ error: "Could not generate replies. " + error.message });
  }
}

export async function autoTagContact(req, res) {
  const { contact, messages = [], emails = [] } = req.body ?? {};

  if (!contact) {
    return res.status(400).json({ error: "Contact data is required." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const recentMsgs = messages.slice(-5).map((m) => `${m.direction}: ${m.body}`).join("\n");
    const recentEmails = emails.slice(-5).map((e) => `Subject: ${e.subject}`).join("\n");

    const prompt = `You are a CRM assistant. Analyze this contact and suggest relevant tags (comma-separated, lowercase, no spaces within tags use hyphens). Tags should describe the client's situation, needs, or status.

Contact: ${contact.firstName} ${contact.lastName}
Email: ${contact.email || "none"}
Phone: ${contact.phone || "none"}
Current tags: ${contact.tags || "none"}
Notes: ${contact.notes || "none"}

Recent messages:
${recentMsgs || "none"}

Recent emails:
${recentEmails || "none"}

Return ONLY a JSON array of suggested tags (3-6 tags max). Use short, descriptive tags.
Example: ["new-client", "1099-filer", "needs-follow-up", "real-estate"]
No markdown, just JSON array.`;

    const text = await groqGenerate(prompt, 150, 0.5);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ tags: Array.isArray(parsed) ? parsed : [] });
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return res.json({ tags: Array.isArray(parsed) ? parsed : [] });
        } catch { /* fall through */ }
      }
      return res.json({ tags: [] });
    }
  } catch (error) {
    console.error("Auto-tag failed:", error);
    return res.status(500).json({ error: "Could not suggest tags. " + error.message });
  }
}

export async function meetingPrepBrief(req, res) {
  const { appointment, contact, messages = [] } = req.body ?? {};

  if (!appointment) {
    return res.status(400).json({ error: "Appointment data is required." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const recentMsgs = messages.slice(-3).map((m) => `${m.direction}: ${m.body}`).join("\n");

    const prompt = `You are a CRM assistant preparing a staff member for an upcoming appointment. Generate a brief prep sheet with this exact structure:

• **Client Situation**: [1-2 sentences about the client's circumstances]
• **Key Topics**:
  – [topic 1]
  – [topic 2]
  – [topic 3]
• **Red Flags / Follow-ups**:
  – [concern 1]
  – [concern 2]
  – [concern 3]

Appointment:
- Service: ${appointment.service}
- Preparer: ${appointment.tax_preparer}
- Date: ${appointment.appointment_date}
- Time: ${appointment.appointment_time}
- Duration: ${appointment.duration_minutes} min
- Visit format: ${appointment.visit_format || "not specified"}
- Client message: ${appointment.message || "none"}

Client: ${contact ? `${contact.firstName} ${contact.lastName}` : "Unknown"}
${contact?.email ? `Email: ${contact.email}` : ""}
${contact?.phone ? `Phone: ${contact.phone}` : ""}
${contact?.tags ? `Tags: ${contact.tags}` : ""}
${contact?.notes ? `Notes: ${contact.notes}` : ""}

Recent messages:
${recentMsgs || "none"}

Keep each section concise. Use **bold** for labels. Use • and – for bullets.`;

    const text = await groqGenerate(prompt, 250, 0.5);
    return res.json({ brief: text || "No prep brief available." });
  } catch (error) {
    console.error("Meeting prep failed:", error);
    return res.status(500).json({ error: "Could not generate prep brief. " + error.message });
  }
}

export async function revenueInsights(req, res) {
  const { appointments = [], contacts = [], campaigns = [], emails = [] } = req.body ?? {};

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured." });
  }

  try {
    const totalAppts = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const booked = appointments.filter((a) => a.status === "booked").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const services = {};
    appointments.forEach((a) => {
      const s = a.service || "Unknown";
      services[s] = (services[s] || 0) + 1;
    });
    const preparers = {};
    appointments.forEach((a) => {
      const p = a.tax_preparer || "Unknown";
      preparers[p] = (preparers[p] || 0) + 1;
    });

    const prompt = `You are a business analytics advisor for DPS Professional Tax Services. Analyze this data and provide 3-5 key insights and recommendations.

Data summary:
- Total appointments: ${totalAppts}
- Confirmed: ${confirmed}, Booked: ${booked}, Cancelled: ${cancelled}
- Total contacts: ${contacts.length}
- Total campaigns: ${campaigns.length}
- Total emails sent: ${emails.length}
- Services breakdown: ${JSON.stringify(services)}
- Preparer workload: ${JSON.stringify(preparers)}

Return a JSON array of insights (max 5):
[{ "title": "short title", "insight": "1-2 sentence insight", "recommendation": "actionable suggestion", "priority": "high|medium|low" }]

No markdown, just JSON.`;

    const text = await groqGenerate(prompt, 600, 0.6);
    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      return res.json({ insights: Array.isArray(parsed) ? parsed : [] });
    } catch {
      return res.json({ insights: [] });
    }
  } catch (error) {
    console.error("Revenue insights failed:", error);
    return res.status(500).json({ error: "Could not generate insights. " + error.message });
  }
}