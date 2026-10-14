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

export async function fetchContactDocuments(contactId) {
  const data = await apiResponse(
    await fetch(
      `${API}/api/staff/contacts/${encodeURIComponent(contactId)}/documents`,
      { headers: staffHeaders(), cache: "no-store" }
    )
  );

  return Array.isArray(data.documents) ? data.documents : [];
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
