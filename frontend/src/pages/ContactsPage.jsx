import { useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import ContactSummaryCard from "../components/ContactSummaryCard";
import ContactDocuments from "../components/ContactDocuments";
import ConversationPanel from "../components/ConversationPanel";
import AddContactForm from "../components/AddContactForm";

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
    onDeleteContact,
    onCancelEditContact,
    onDeleteMessage,
    onDeleteConversation,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTag, setActiveTag] = useState("");
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteFeedback, setInviteFeedback] = useState(null);
    const navigate = useNavigate();

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

        return contacts.filter((contact) => {
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();
            const notes = (contact.notes || "").toLowerCase();

            const matchesSearch =
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

            return matchesSearch && matchesTag;
        });
    }, [contacts, searchTerm, activeTag]);

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

            <div className="d-flex flex-wrap gap-2 mb-3">
                <Button
                    size="sm"
                    variant={activeTag === "" ? "dark" : "outline-secondary"}
                    onClick={() => setActiveTag("")}
                >
                    All
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
                <Col md={3} className="contacts-column-compact">
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
                    <ContactSummaryCard
                        selectedContact={selectedContact}
                        conversation={conversation}
                        emailMessages={emailMessages}
                    />

                    <ContactDocuments
                        key={selectedContact?._id || "none"}
                        contactId={selectedContact?._id}
                    />


                    {selectedContact && (
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Button
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
                                Book Appointment for {selectedContact.firstName}
                            </Button>

                            <Button
                                variant="outline-primary"
                                disabled={sendingInvite || !selectedContact.email}
                                onClick={handleSendAccountLinkInvitation}
                            >
                                {sendingInvite
                                    ? "Sending invitation..."
                                    : "Send account-link invitation"}
                            </Button>
                        </div>
                    )}

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
                </Col>

                <Col md={4}>
                    <AddContactForm
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
