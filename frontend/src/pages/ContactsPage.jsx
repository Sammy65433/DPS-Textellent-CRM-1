import { Row, Col, Alert, Button, Badge } from "react-bootstrap";
import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import ContactSummaryCard from "../components/ContactSummaryCard";
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

    const uniqueTags = useMemo(() => {
        const tags = contacts
            .flatMap(contact =>
                (contact.tags || "")
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(Boolean)
            );

        return [...new Set(tags)];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();
            const notes = (contact.notes || "").toLowerCase();

            const matchesSearch =
                fullName.includes(searchTerm.toLowerCase()) ||
                phone.includes(searchTerm.toLowerCase()) ||
                email.includes(searchTerm.toLowerCase()) ||
                tags.includes(searchTerm.toLowerCase()) ||
                notes.includes(searchTerm.toLowerCase());

            const matchesTag = activeTag
                ? tags.split(",").map(tag => tag.trim()).includes(activeTag.toLowerCase())
                : true;

            return matchesSearch && matchesTag;
        });
    }, [contacts, searchTerm, activeTag]);

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Contacts"
                subtitle="Manage contacts and view message conversations."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <div className="d-flex flex-wrap gap-2 mb-3">
                <Button
                    size="sm"
                    variant={activeTag === "" ? "dark" : "outline-secondary"}
                    onClick={() => setActiveTag("")}
                >
                    All
                </Button>

                {uniqueTags.map(tag => (
                    <Badge
                        key={tag}
                        pill
                        bg={activeTag === tag ? "primary" : "secondary"}
                        className="tag-filter-pill"
                        onClick={() => setActiveTag(prev => (prev === tag ? "" : tag))}
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
                        onSelectContact={onSelectContact}
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
