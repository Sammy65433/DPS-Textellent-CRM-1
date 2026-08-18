import { Row, Col, Alert } from "react-bootstrap";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ContactsList from "../components/ContactsList";
import ConversationPanel from "../components/ConversationPanel";
import AddContactForm from "../components/AddContactForm";
import EmailComposer from "../components/EmailComposer";

function ContactsPage({
    theme,
    onToggleTheme,
    alert,
    contacts,
    selectedContact,
    conversation,
    loadingConversation,
    messageForm,
    setMessageForm,
    contactForm,
    setContactForm,
    templates,
    editingContact,
    emailForm,
    setEmailForm,
    onSelectContact,
    onSendMessage,
    onSendEmail,
    onCreateContact,
    onEditContact,
    onDeleteContact,
    onCancelEditContact,
    onDeleteMessage,
    onDeleteConversation,
}) {
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Contacts"
                subtitle="Manage contacts and view message conversations."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <Row className="g-4">
                <Col md={3}>
                    <ContactsList
                        contacts={contacts}
                        selectedContact={selectedContact}
                        onSelectContact={onSelectContact}
                        onEditContact={onEditContact}
                        onDeleteContact={onDeleteContact}
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

                    <EmailComposer
                        selectedContact={selectedContact}
                        emailForm={emailForm}
                        setEmailForm={setEmailForm}
                        templates={templates}
                        onSendEmail={onSendEmail}
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
