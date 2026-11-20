const API = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(
  /\/$/,
  ""
);

function staffHeaders(json = false) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Staff login required.");

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

async function apiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "CRM request failed.");
  }

  return data;
}

export async function fetchContacts() {
  return apiResponse(
    await fetch(`${API}/api/contacts`, { headers: staffHeaders() })
  );
}

export async function createContact(payload) {
  return apiResponse(
    await fetch(`${API}/api/contacts`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function updateContact(contactId, payload) {
  return apiResponse(
    await fetch(`${API}/api/contacts/${encodeURIComponent(contactId)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteContact(contactId) {
  return apiResponse(
    await fetch(`${API}/api/contacts/${encodeURIComponent(contactId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function importContacts(csv) {
  return apiResponse(
    await fetch(`${API}/api/contacts/import`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify({ csv }),
    })
  );
}

export async function fetchContactLists() {
  return apiResponse(await fetch(`${API}/api/contact-lists`, { headers: staffHeaders() }));
}

export async function createContactList(name) {
  return apiResponse(
    await fetch(`${API}/api/contact-lists`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify({ name }),
    })
  );
}

export async function updateContactList(listId, payload) {
  return apiResponse(
    await fetch(`${API}/api/contact-lists/${encodeURIComponent(listId)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteContactList(listId) {
  return apiResponse(
    await fetch(`${API}/api/contact-lists/${encodeURIComponent(listId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function fetchMedia() {
  return apiResponse(await fetch(`${API}/api/media`, { headers: staffHeaders() }));
}

export async function uploadMedia(filename, mimeType, base64) {
  return apiResponse(
    await fetch(`${API}/api/media`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify({ filename, mimeType, data: base64 }),
    })
  );
}

export async function deleteMedia(mediaId) {
  return apiResponse(
    await fetch(`${API}/api/media/${encodeURIComponent(mediaId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function fetchDripCampaigns() {
  return apiResponse(await fetch(`${API}/api/drip-campaigns`, { headers: staffHeaders() }));
}

export async function createDripCampaign(payload) {
  return apiResponse(
    await fetch(`${API}/api/drip-campaigns`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function updateDripCampaign(id, payload) {
  return apiResponse(
    await fetch(`${API}/api/drip-campaigns/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteDripCampaign(id) {
  return apiResponse(
    await fetch(`${API}/api/drip-campaigns/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function enrollDripCampaign(id, contactIds) {
  return apiResponse(
    await fetch(`${API}/api/drip-campaigns/${encodeURIComponent(id)}/enroll`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify({ contactIds }),
    })
  );
}

export async function fetchAutoResponders() {
  return apiResponse(await fetch(`${API}/api/auto-responders`, { headers: staffHeaders() }));
}

export async function updateAutoResponder(type, payload) {
  return apiResponse(
    await fetch(`${API}/api/auto-responders/${encodeURIComponent(type)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchContactDocuments(contactId) {
  const data = await apiResponse(
    await fetch(
      `${API}/api/staff/contacts/${encodeURIComponent(contactId)}/documents`,
      { headers: staffHeaders(), cache: "no-store" }
    )
  );

  return Array.isArray(data.documents) ? data.documents : [];
}

export async function linkClientAccount(contactId) {
  return apiResponse(
    await fetch(
      `${API}/api/staff/contacts/${encodeURIComponent(contactId)}/link-client`,
      {
        method: "POST",
        headers: staffHeaders(true),
      }
    )
  );
}

export async function fetchMessages() {
  return apiResponse(
    await fetch(`${API}/api/messages`, { headers: staffHeaders() })
  );
}

export async function fetchConversation(contactId) {
  return apiResponse(
    await fetch(
      `${API}/api/messages/contact/${encodeURIComponent(contactId)}`,
      { headers: staffHeaders() }
    )
  );
}

export async function sendMessage(payload) {
  return apiResponse(
    await fetch(`${API}/api/messages/send`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteMessageById(messageId) {
  return apiResponse(
    await fetch(`${API}/api/messages/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function deleteMessage(messageId) {
  return deleteMessageById(messageId);
}

export async function deleteConversationByContact(contactId) {
  return apiResponse(
    await fetch(
      `${API}/api/messages/contact/${encodeURIComponent(contactId)}`,
      { method: "DELETE", headers: staffHeaders() }
    )
  );
}

export async function fetchEmails() {
  return apiResponse(
    await fetch(`${API}/api/emails`, { headers: staffHeaders() })
  );
}

export async function fetchEmailsByContact(contactId) {
  return apiResponse(
    await fetch(
      `${API}/api/emails/contact/${encodeURIComponent(contactId)}`,
      { headers: staffHeaders() }
    )
  );
}

export async function sendEmail(payload) {
  return apiResponse(
    await fetch(`${API}/api/emails/send`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteEmailById(emailId) {
  return apiResponse(
    await fetch(`${API}/api/emails/${encodeURIComponent(emailId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function deleteEmailsByContact(contactId) {
  return apiResponse(
    await fetch(
      `${API}/api/emails/contact/${encodeURIComponent(contactId)}`,
      { method: "DELETE", headers: staffHeaders() }
    )
  );
}

export async function fetchTemplates() {
  return apiResponse(
    await fetch(`${API}/api/templates`, { headers: staffHeaders() })
  );
}

export async function createTemplate(payload) {
  return apiResponse(
    await fetch(`${API}/api/templates`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteTemplate(templateId) {
  return apiResponse(
    await fetch(`${API}/api/templates/${encodeURIComponent(templateId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function updateTemplate(templateId, payload) {
  return apiResponse(
    await fetch(`${API}/api/templates/${encodeURIComponent(templateId)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function sendAIChat(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    return await apiResponse(
      await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: staffHeaders(true),
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function naturalLanguageSearch(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/search`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function getSmartFollowUps(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/follow-ups`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function getSmartReplies(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/smart-replies`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function autoTagContact(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/auto-tag`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function getMeetingPrep(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/meeting-prep`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function getRevenueInsights(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/insights`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function aiScheduleAppointment(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/schedule`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function extractDocumentData(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/extract-document`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function generateContactSummary(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/contact-summary`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function generateCampaignCopy(payload) {
  return apiResponse(
    await fetch(`${API}/api/ai/campaign-copy`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchCampaigns() {
  return apiResponse(
    await fetch(`${API}/api/campaigns`, { headers: staffHeaders() })
  );
}

export async function createCampaign(payload) {
  return apiResponse(
    await fetch(`${API}/api/campaigns`, {
      method: "POST",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function updateCampaign(campaignId, payload) {
  return apiResponse(
    await fetch(`${API}/api/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "PATCH",
      headers: staffHeaders(true),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteCampaign(campaignId) {
  return apiResponse(
    await fetch(`${API}/api/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "DELETE",
      headers: staffHeaders(),
    })
  );
}

export async function sendCampaign(campaignId) {
  return apiResponse(
    await fetch(`${API}/api/campaigns/${encodeURIComponent(campaignId)}/send`, {
      method: "POST",
      headers: staffHeaders(),
    })
  );
}

export async function loginUser(formData) {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  return apiResponse(response);
}
