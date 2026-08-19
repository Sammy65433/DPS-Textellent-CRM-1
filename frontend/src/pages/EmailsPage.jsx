import { Row, Col, Alert, Card, Spinner, Button } from "react-bootstrap";
import { useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import AddContactForm from "../components/AddContactForm";
import EmailComposer from "../components/EmailComposer";
import EmailContactSummaryCard from "../components/EmailContactSummaryCard";

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

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();
            const notes = (contact.notes || "").toLowerCase();

            return (
                fullName.includes(searchTerm.toLowerCase()) ||
                phone.includes(searchTerm.toLowerCase()) ||
                email.includes(searchTerm.toLowerCase()) ||
                tags.includes(searchTerm.toLowerCase()) ||
                notes.includes(searchTerm.toLowerCase())
            );
        });
    }, [contacts, searchTerm]);

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <div className="email-page-theme">
                <PageHeader
                    title="Emails"
                    subtitle="Manage email communication with your contacts."
                />

                {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

                <Row className="g-4">
                    <Col md={3} className="contacts-column-compact">
                        <ContactsList
                            contacts={filteredContacts}
                            selectedContact={selectedContact}
                            onSelectContact={onSelectContact}
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

                        <Card className="email-history-card page-panel-emails border-0">
                            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                                <span>Email History</span>

                                {selectedContact && emailMessages.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => onDeleteEmailConversation(selectedContact._id)}
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
                                        {emailMessages.map(email => (
                                            <div key={email._id} className="email-row">
                                                <div className="email-bubble">
                                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                                        <div className="w-100">
                                                            <div className="email-subject">{email.subject}</div>
                                                            <div className="email-body-text">{email.body}</div>
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
