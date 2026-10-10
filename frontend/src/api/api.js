

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function fetchMessages() {
    const res = await fetch(`${API}/api/messages?userId=user123`);
    return res.json();
}

export async function fetchConversation(contactId) {
    const res = await fetch(`${API}/api/messages/contact/${contactId}`);
    return res.json();
}

export async function fetchTemplates() {
    const res = await fetch(`${API}/api/templates?userId=user123`);
    return res.json();
}

export async function fetchCampaigns() {
    const res = await fetch(`${API}/api/campaigns?userId=user123`);
    return res.json();
}

export async function fetchEmails() {
    const res = await fetch(`${API}/api/emails?userId=user123`);
    return res.json();
}

export async function fetchEmailsByContact(contactId) {
    const res = await fetch(`${API}/api/emails/contact/${contactId}`);
    return res.json();
}

export async function sendMessage(payload) {
    const res = await fetch(`${API}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function sendEmail(payload) {
    const res = await fetch(`${API}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function createTemplate(payload) {
    const res = await fetch(`${API}/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function deleteTemplate(templateId) {
    const res = await fetch(`${API}/api/templates/${templateId}`, {
        method: "DELETE",
    });
    return res.json();
}

export async function createCampaign(payload) {
    const res = await fetch(`${API}/api/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function sendCampaign(campaignId) {
    const res = await fetch(`${API}/api/campaigns/${campaignId}/send`, {
        method: "POST",
    });
    return res.json();
}

export async function deleteCampaign(campaignId) {
    const res = await fetch(`${API}/api/campaigns/${campaignId}`, {
        method: "DELETE",
    });
    return res.json();
}
export async function deleteMessage(messageId) {
    const res = await fetch(`${API}/api/messages/${messageId}`, {
        method: "DELETE",
    });
    return res.json();
}

export async function deleteMessageById(messageId) {
    const res = await fetch(`${API}/api/messages/${messageId}`, {
        method: "DELETE",
    });
    return res.json();
}

export async function deleteConversationByContact(contactId) {
    const res = await fetch(`${API}/api/messages/contact/${contactId}`, {
        method: "DELETE",
    });
    return res.json();
}

export async function deleteEmailById(emailId) {
    const res = await fetch(`${API}/api/emails/${emailId}`, {
        method: "DELETE",
    });
    return res.json();
}

export async function deleteEmailsByContact(contactId) {
    const res = await fetch(`${API}/api/emails/contact/${contactId}`, {
        method: "DELETE",
    });
    return res.json();
}
export async function updateCampaign(campaignId, payload) {
    const res = await fetch(`${API}/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}
function staffHeaders(json = false) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Staff login required.");

    return {
        ...(json ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
    };
}

async function contactResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || data.error || "Contacts request failed.");
    }
    return data;
}
export async function fetchContacts() {
    const res = await fetch(`${API}/api/contacts`, {
        headers: staffHeaders(),
    });
    return contactResponse(res);
}

export async function createContact(payload) {
    const res = await fetch(`${API}/api/contacts`, {
        method: "POST",
        headers: staffHeaders(true),
        body: JSON.stringify(payload),
    });
    return contactResponse(res);
}

export async function updateContact(contactId, payload) {
    const res = await fetch(`${API}/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: staffHeaders(true),
        body: JSON.stringify(payload),
    });
    return contactResponse(res);
}

export async function deleteContact(contactId) {
    const res = await fetch(`${API}/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: staffHeaders(),
    });
    return contactResponse(res);
}
