import { useState } from "react";
import { Card, Badge, Spinner, Form, Button } from "react-bootstrap";
import { FaPaperPlane, FaTrash, FaMagic } from "react-icons/fa";
import { getSmartReplies } from "../api/api";

function ConversationPanel({
    selectedContact,
    conversation,
    loadingConversation,
    messageForm,
    setMessageForm,
    templates,
    onSendMessage,
    onDeleteMessage,
    onDeleteConversation,
}) {
    const [smartReplies, setSmartReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);

    async function loadSmartReplies() {
        if (!selectedContact) return;
        setLoadingReplies(true);
        try {
            const result = await getSmartReplies({
                contact: selectedContact,
                messages: conversation,
            });
            setSmartReplies(Array.isArray(result.suggestions) ? result.suggestions : []);
        } catch {
            setSmartReplies([]);
        } finally {
            setLoadingReplies(false);
        }
    }

    return (
        <Card className="crm-card border-0">
            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                <div>
                    Conversation
                    {selectedContact && (
                        <Badge bg="secondary" className="ms-2">
                            {selectedContact.firstName} {selectedContact.lastName}
                        </Badge>
                    )}
                </div>

                {selectedContact && (
                    <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onDeleteConversation(selectedContact._id)}
                    >
                        Delete All
                    </Button>
                )}
            </Card.Header>

            <Card.Body className="conversation-body">
                {!selectedContact ? (
                    <p className="conversation-empty">
                        Select a contact to view messages.
                    </p>
                ) : loadingConversation ? (
                    <Spinner animation="border" />
                ) : (
                    <div className="message-stack">
                        {conversation.map(msg => (
                            <div
                                key={msg._id}
                                className={`message-row ${msg.direction === "outbound" ? "outbound" : "inbound"
                                    }`}
                            >
                                <div
                                    className={`message-bubble ${msg.direction === "outbound" ? "outbound" : "inbound"
                                        }`}
                                >
                                    <div className="message-text">{msg.body}</div>
                                    <div className="message-meta d-flex justify-content-between align-items-center">
                                        <span>
                                            {msg.direction} •{" "}
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="link"
                                            className="message-delete-btn"
                                            onClick={() => onDeleteMessage(msg._id)}
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

            <Card.Footer className="conversation-footer">
                {selectedContact && (
                    <div className="mb-2">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            disabled={loadingReplies}
                            onClick={loadSmartReplies}
                        >
                            {loadingReplies ? "Generating..." : "✨ Suggest Replies"}
                        </Button>
                        {smartReplies.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-2">
                                {smartReplies.map((reply, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={() =>
                                            setMessageForm((prev) => ({ ...prev, body: reply }))
                                        }
                                    >
                                        {reply}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Form onSubmit={onSendMessage}>
                    <Form.Select
                        className="mb-2 template-select-compact"
                        value={messageForm.templateId}
                        onChange={e => {
                            const selectedId = e.target.value;
                            const selectedTemplate = templates.find(
                                template => template._id === selectedId
                            );

                            setMessageForm(prev => ({
                                ...prev,
                                templateId: selectedId,
                                body: selectedTemplate ? selectedTemplate.body : prev.body,
                            }));
                        }}
                    >
                        <option value="">Choose template (optional)</option>
                        {templates.map(template => (
                            <option key={template._id} value={template._id}>
                                {template.name}
                            </option>
                        ))}
                    </Form.Select>

                    <Form.Control
                        as="textarea"
                        rows={3}
                        className="message-textarea-compact"
                        placeholder="Type your message"
                        value={messageForm.body}
                        onChange={e =>
                            setMessageForm(prev => ({
                                ...prev,
                                body: e.target.value,
                            }))
                        }
                    />

                    <div className="d-flex justify-content-end mt-2">
                        <Button type="submit" variant="dark">
                            <FaPaperPlane className="me-2" />
                            Send
                        </Button>
                    </div>
                </Form>
            </Card.Footer>
        </Card>
    );
}

export default ConversationPanel;
