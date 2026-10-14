import { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import AddContactForm from "../components/AddContactForm";
import EmailComposer from "../components/EmailComposer";
import EmailContactSummaryCard from "../components/EmailContactSummaryCard";
import ContactDocuments from "../components/ContactDocuments";

function EmailsPage({
    theme,
    onToggleTheme,
    alert,
    contacts,
    selectedContact,
    emailMessages,
    loadingEmails,
    emailForm,
    setEmailForm,
    contactForm,
    setContactForm,
    templates,
    editingContact,
    onSelectContact,
    onSendEmail,
    onCreateContact,
    onEditContact,
    onDeleteContact,
    onCancelEditContact,
    onDeleteEmail,
    onDeleteEmailConversation,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteFeedback, setInviteFeedback] = useState(null);
    const navigate = useNavigate();

    const filteredContacts = useMemo(() => {
        const search = searchTerm.toLowerCase();

        return contacts.filter((contact) => {
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();
            const notes = (contact.notes || "").toLowerCase();

            return (
                fullName.includes(search) ||
                phone.includes(search) ||
                email.includes(search) ||
                tags.includes(search) ||
                notes.includes(search)
            );
        });
    }, [contacts, searchTerm]);

    function handleSelectContact(contact) {
        setInviteFeedback(null);
        onSelectContact(contact);
    }

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
                message: "This contact needs an email address.",
            });
            return;
        }

        if (
            !window.confirm(`Send an account-link invitation to ${name} at ${email}?`)
        ) {
            return;
        }

        setSendingInvite(true);
        setInviteFeedback(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Staff login required.");

            const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5002")
                .replace(/\/$/, "");

            const response = await fetch(
                `${apiBase}/api/contact-links/${encodeURIComponent(contact._id)}/request`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
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
                message: error.message || "Could not send the invitation.",
            });
        } finally {
            setSendingInvite(false);
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <div className="email-page-theme">
                <PageHeader
                    title="Emails"
                    subtitle="Manage email communication with your contacts."
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

                    <Col md={5} className="panel-column">
                        <EmailContactSummaryCard
                            selectedContact={selectedContact}
                            emailMessages={emailMessages}
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

                        <ContactDocuments
                            key={selectedContact?._id || "none"}
                            contactId={selectedContact?._id}
                        />

                        <Card className="email-history-card page-panel-emails border-0">
                            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                                <span>Email History</span>
                                {selectedContact && emailMessages.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() =>
                                            onDeleteEmailConversation(selectedContact._id)
                                        }
                                    >
                                        Delete All
                                    </Button>
                                )}
                            </Card.Header>

                            <Card.Body className="email-thread-body">
                                {!selectedContact ? (
                                    <p className="conversation-empty">
                                        Select a contact to view email history.
                                    </p>
                                ) : loadingEmails ? (
                                    <Spinner animation="border" />
                                ) : emailMessages.length === 0 ? (
                                    <p className="conversation-empty">
                                        No emails sent to this contact yet.
                                    </p>
                                ) : (
                                    <div className="email-stack">
                                        {emailMessages.map((email) => (
                                            <div key={email._id} className="email-row">
                                                <div className="email-bubble">
                                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                                        <div className="w-100">
                                                            <div className="email-subject">
                                                                {email.subject}
                                                            </div>
                                                            <div className="email-body-text">
                                                                {email.body}
                                                            </div>
                                                            <div className="email-meta">
                                                                email •{" "}
                                                                {new Date(email.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="link"
                                                            className="message-delete-btn"
                                                            onClick={() => onDeleteEmail(email._id)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        <div className="crm-card page-panel-emails-secondary border-0">
                            <EmailComposer
                                selectedContact={selectedContact}
                                emailForm={emailForm}
                                setEmailForm={setEmailForm}
                                templates={templates}
                                onSendEmail={onSendEmail}
                            />
                        </div>
                    </Col>

                    <Col md={4}>
                        <div className="crm-card page-panel-emails border-0">
                            <AddContactForm
                                contactForm={contactForm}
                                setContactForm={setContactForm}
                                onCreateContact={onCreateContact}
                                isEditing={!!editingContact}
                                onCancelEdit={onCancelEditContact}
                            />
                        </div>
                    </Col>
                </Row>
            </div>
        </AppLayout>
    );
}

export default EmailsPage;
