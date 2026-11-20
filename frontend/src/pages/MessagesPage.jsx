import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { FaSearch, FaTimes } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import ConversationPanel from "../components/ConversationPanel";

function MessagesPage({
    theme,
    onToggleTheme,
    alert,
    contacts = [],
    messages = [],
    selectedContact,
    conversation,
    loadingConversation,
    messageForm,
    setMessageForm,
    templates,
    onSendMessage,
    onDeleteMessage,
    onDeleteConversation,
    onSelectContact,
}) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const filteredContacts = useMemo(() => {
        const q = search.toLowerCase().trim();
        return contacts.filter((c) => {
            const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
            const phone = (c.phone || "").toLowerCase();
            const matches = !q || name.includes(q) || phone.includes(q);
            // filter by has messages
            const hasMsg = messages.some((m) => String(m.contactId?._id || m.contactId) === String(c._id));
            if (filter === "unread" || filter === "incoming" || filter === "unanswered") {
                // approximate: contacts with messages
                return matches && hasMsg;
            }
            return matches;
        });
    }, [contacts, messages, search, filter]);

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Messages" subtitle="View and send SMS conversations with contacts." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <Row className="g-3">
                {/* Left: conversation list */}
                <Col md={4}>
                    <Card className="crm-card border-0 h-100">
                        <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                            <span>Conversations</span>
                            <span className="badge bg-secondary">{filteredContacts.length}</span>
                        </Card.Header>
                        <Card.Body className="p-2">
                            <div className="d-flex gap-1 mb-2 flex-wrap">
                                {["all", "unread", "incoming", "unanswered"].map((f) => (
                                    <Button
                                        key={f}
                                        size="sm"
                                        variant={filter === f ? "primary" : "outline-secondary"}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </Button>
                                ))}
                            </div>
                            <div className="d-flex mb-2">
                                <FaSearch className="me-2 text-muted mt-2" />
                                <Form.Control
                                    size="sm"
                                    placeholder="Search contacts or phone"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <Button size="sm" variant="outline-secondary" onClick={() => setSearch("")} className="ms-1">
                                        <FaTimes />
                                    </Button>
                                )}
                            </div>
                            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                {filteredContacts.length === 0 ? (
                                    <p className="text-muted small text-center mt-3">No conversations found.</p>
                                ) : (
                                    filteredContacts.map((c) => (
                                        <div
                                            key={c._id}
                                            className={`p-2 mb-1 rounded ${selectedContact?._id === c._id ? "bg-primary text-white" : "bg-light"}`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => onSelectContact(c)}
                                        >
                                            <div className="fw-semibold small">
                                                {c.firstName} {c.lastName}
                                            </div>
                                            <div className="small" style={{ opacity: 0.8 }}>
                                                {c.phone}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Middle: conversation */}
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
                </Col>

                {/* Right: details/composer */}
                <Col md={3}>
                    <Card className="crm-card border-0">
                        <Card.Header className="card-header-clean">Attachments</Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-0">Files exchanged appear here.</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </AppLayout>
    );
}

export default MessagesPage;
