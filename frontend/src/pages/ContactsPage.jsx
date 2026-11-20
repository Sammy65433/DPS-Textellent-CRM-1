import { useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import ContactSummaryCard from "../components/ContactSummaryCard";
import ContactDocuments from "../components/ContactDocuments";
import ConversationPanel from "../components/ConversationPanel";
import AddContactForm from "../components/AddContactForm";
import { naturalLanguageSearch, importContacts, fetchContactLists, createContactList, deleteContactList } from "../api/api";

function ContactsPage({
    theme,
    onToggleTheme,
    alert,
    contacts,
    selectedContact,
    conversation,
    emailMessages,
    loadingConversation,
    messageForm,
    setMessageForm,
    contactForm,
    setContactForm,
    templates,
    editingContact,
    onSelectContact,
    onSendMessage,
    onCreateContact,
    onEditContact,
    onSaveSummaryToNotes,
    onDeleteContact,
    onCancelEditContact,
    onDeleteMessage,
    onDeleteConversation,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [aiSearchQuery, setAiSearchQuery] = useState("");
    const [aiSearchLoading, setAiSearchLoading] = useState(false);
    const [aiSearchResult, setAiSearchResult] = useState(null);
    const [activeTag, setActiveTag] = useState("");
    const [contactLists, setContactLists] = useState([]);
    const [activeList, setActiveList] = useState("");
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);
    const [contactStatusFilter, setContactStatusFilter] = useState("all");
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteFeedback, setInviteFeedback] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const templateId = location.state?.templateId;
        if (templateId) {
            const tpl = templates.find((t) => t._id === templateId);
            setMessageForm((prev) => ({
                ...prev,
                templateId,
                body: tpl ? tpl.body : prev.body,
            }));
        }
    }, [location.state?.templateId, templates]);

    useEffect(() => {
        fetchContactLists()
            .then((data) => setContactLists(Array.isArray(data) ? data : []))
            .catch(() => setContactLists([]));
    }, []);

    async function handleImportCsv(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const result = await importContacts(text);
            alert(`Imported ${result.created} contacts (${result.skipped} skipped).`);
            // reload contacts via parent? ContactsPage doesn't have loadData. 
            // We'll just reload the page to refresh.
            window.location.reload();
        } catch (error) {
            alert(error.message || "Import failed.");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    const uniqueTags = useMemo(() => {
        const tags = contacts.flatMap((contact) =>
            (contact.tags || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
        );

        return [...new Set(tags)];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        const search = searchTerm.toLowerCase();

        let base = contacts.filter((contact) => {
            if (activeList) {
                const list = contactLists.find((l) => l._id === activeList);
                if (list && Array.isArray(list.contactIds)) {
                    const idSet = new Set(list.contactIds.map(String));
                    if (!idSet.has(String(contact._id))) return false;
                }
            }
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();
            const notes = (contact.notes || "").toLowerCase();

            const matchesSearch =
                !search ||
                fullName.includes(search) ||
                phone.includes(search) ||
                email.includes(search) ||
                tags.includes(search) ||
                notes.includes(search);

            const matchesTag = activeTag
                ? tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .includes(activeTag.toLowerCase())
                : true;

            const created = contact.createdAt ? new Date(contact.createdAt) : null;
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            let matchesStatus = true;
            if (contactStatusFilter === "recent") {
                matchesStatus = !!created && (now - created.getTime()) <= 30 * dayMs;
            } else if (contactStatusFilter === "inactive") {
                matchesStatus = !created || (now - created.getTime()) > 90 * dayMs;
            } else if (contactStatusFilter === "active") {
                matchesStatus = !!created && (now - created.getTime()) <= 90 * dayMs;
            }

            return matchesSearch && matchesTag && matchesStatus;
        });

        if (aiSearchResult && Array.isArray(aiSearchResult.matchedIds)) {
            const idSet = new Set(aiSearchResult.matchedIds.map(String));
            base = base.filter((c) => idSet.has(String(c._id)));
        }

        return base;
    }, [contacts, searchTerm, activeTag, aiSearchResult, contactStatusFilter, activeList, contactLists]);

    async function handleSendAccountLinkInvitation() {
        if (!selectedContact?._id || sendingInvite) return;

        const contact = selectedContact;
        const name =
            `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
            "this contact";
        const email = contact.email?.trim();

        if (!email) {
            setInviteFeedback({
                variant: "warning",
                message:
                    "This contact needs an email address before an invitation can be sent.",
            });
            return;
        }

        const confirmed = window.confirm(
            `Send an account-link invitation to ${name} at ${email}? For this local test, use only a dummy contact and email you control.`
        );

        if (!confirmed) return;

        setInviteFeedback(null);
        setSendingInvite(true);

        try {
            const staffToken = localStorage.getItem("token");

            if (!staffToken) {
                throw new Error(
                    "Your staff session is missing. Sign in to the CRM again."
                );
            }

            const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

            if (!apiBase) {
                throw new Error("The CRM API URL is not configured.");
            }

            const response = await fetch(
                `${apiBase}/api/contact-links/${encodeURIComponent(contact._id)}/request`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${staffToken}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not send the account-link invitation."
                );
            }

            setInviteFeedback({
                variant: "success",
                message: `Account-link invitation sent to ${email}.`,
            });
        } catch (error) {
            setInviteFeedback({
                variant: "danger",
                message:
                    error.message || "Could not send the account-link invitation.",
            });
        } finally {
            setSendingInvite(false);
        }
    }

    function handleSelectContact(contact) {
        setInviteFeedback(null);
        onSelectContact(contact);
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Contacts"
                subtitle="Manage contacts and view message conversations."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            {inviteFeedback && (
                <Alert
                    variant={inviteFeedback.variant}
                    dismissible
                    onClose={() => setInviteFeedback(null)}
                >
                    {inviteFeedback.message}
                </Alert>
            )}

            <Card className="crm-card border-0 mb-3" data-tour="contacts-search">
                <Card.Body>
                    <Form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!aiSearchQuery.trim()) {
                            setAiSearchResult(null);
                            return;
                        }
                        setAiSearchLoading(true);
                        try {
                            const result = await naturalLanguageSearch({
                                query: aiSearchQuery.trim(),
                                contacts,
                            });
                            setAiSearchResult(result);
                        } catch (error) {
                            setAiSearchResult({ matchedIds: [], explanation: "Search failed." });
                        } finally {
                            setAiSearchLoading(false);
                        }
                    }}>
                        <div className="d-flex gap-2">
                            <Form.Control
                                placeholder="AI search: e.g. 'contacts missing email' or 'clients tagged lead'"
                                value={aiSearchQuery}
                                onChange={(e) => setAiSearchQuery(e.target.value)}
                            />
                            <Button type="submit" variant="primary" disabled={aiSearchLoading}>
                                {aiSearchLoading ? "..." : "AI Search"}
                            </Button>
                            {aiSearchResult && (
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setAiSearchResult(null);
                                        setAiSearchQuery("");
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        {aiSearchResult?.explanation && (
                            <div className="small text-muted mt-1">
                                {aiSearchResult.explanation} — {aiSearchResult.matchedIds?.length || 0} match(es)
                            </div>
                        )}
                    </Form>
                </Card.Body>
            </Card>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <Button size="sm" variant="primary" onClick={() => navigate("/contacts/new")}>
                    + Add Contact
                </Button>
                <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 160 }}
                    value={contactStatusFilter}
                    onChange={(e) => setContactStatusFilter(e.target.value)}
                >
                    <option value="all">All contacts</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="recent">Recent</option>
                </select>
                <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 180 }}
                    value={activeList}
                    onChange={(e) => setActiveList(e.target.value)}
                >
                    <option value="">All lists</option>
                    {contactLists.map((list) => (
                        <option key={list._id} value={list._id}>
                            {list.name} ({list.contactIds?.length || 0})
                        </option>
                    ))}
                </select>

                <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {importing ? "Importing..." : "📥 Import CSV"}
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    style={{ display: "none" }}
                    onChange={handleImportCsv}
                />

                <Button
                    size="sm"
                    variant={activeTag === "" ? "dark" : "outline-secondary"}
                    onClick={() => setActiveTag("")}
                >
                    All tags
                </Button>

                {uniqueTags.map((tag) => (
                    <Badge
                        key={tag}
                        pill
                        bg={activeTag === tag ? "primary" : "secondary"}
                        className="tag-filter-pill"
                        onClick={() => setActiveTag((prev) => (prev === tag ? "" : tag))}
                        style={{ cursor: "pointer" }}
                    >
                        {tag}
                    </Badge>
                ))}
            </div>

            <Row className="g-4">
                <Col md={3} className="contacts-column-compact" data-tour="contacts-list">
                    <ContactsList
                        contacts={filteredContacts}
                        selectedContact={selectedContact}
                        onSelectContact={handleSelectContact}
                        onEditContact={onEditContact}
                        onDeleteContact={onDeleteContact}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </Col>

                <Col md={5}>
                    <ConversationPanel
                        selectedContact={selectedContact}
                        conversation={conversation}
                        loadingConversation={loadingConversation}
                        messageForm={messageForm}
                        setMessageForm={setMessageForm}
                        templates={templates}
                        onSendMessage={onSendMessage}
                        onDeleteMessage={onDeleteMessage}
                        onDeleteConversation={onDeleteConversation}
                    />

                    {selectedContact && (
                        <Accordion className="mt-3" defaultActiveKey="0">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Contact Details</Accordion.Header>
                                <Accordion.Body>
                                    <ContactSummaryCard
data-tour="contacts-summary"
                                        selectedContact={selectedContact}
                                        conversation={conversation}
                                        emailMessages={emailMessages}
                                        onSaveSummaryToNotes={onSaveSummaryToNotes}
                                    />
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={() =>
                                                navigate("/booking", {
                                                    state: {
                                                        customer: {
                                                            first_name: selectedContact.firstName || "",
                                                            last_name: selectedContact.lastName || "",
                                                            phone: selectedContact.phone || "",
                                                            email: selectedContact.email || "",
                                                        },
                                                    },
                                                })
                                            }
                                        >
                                            Book Appointment
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            disabled={sendingInvite || !selectedContact.email}
                                            onClick={handleSendAccountLinkInvitation}
                                        >
                                            {sendingInvite ? "Sending..." : "Send Link Invite"}
                                        </Button>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>Documents</Accordion.Header>
                                <Accordion.Body>
                                    <ContactDocuments
data-tour="contacts-documents"
                                        key={selectedContact?._id || "none"}
                                        contactId={selectedContact?._id}
                                    />
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    )}
                </Col>

                <Col md={4}>
                    <AddContactForm
data-tour="contacts-add"
                        contactForm={contactForm}
                        setContactForm={setContactForm}
                        onCreateContact={onCreateContact}
                        isEditing={!!editingContact}
                        onCancelEdit={onCancelEditContact}
                    />
                </Col>
            </Row>
        </AppLayout>
    );
}

export default ContactsPage;
