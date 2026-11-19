import { useState } from "react";
import { Card, Badge, Button, Spinner } from "react-bootstrap";
import { generateContactSummary, autoTagContact } from "../api/api";
import {
    FaUser,
    FaPhone,
    FaEnvelope,
    FaTag,
    FaStickyNote,
    FaClock,
    FaComments,
} from "react-icons/fa";

function ContactSummaryCard({
    selectedContact,
    conversation = [],
    emailMessages = [],
}) {
    const [aiSummary, setAiSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);

    if (!selectedContact) {
        return (
            <Card className="crm-card page-panel-contacts-secondary border-0 mb-3" data-tour="contacts-summary">
                <Card.Body>
                    <div className="text-muted">
                        Select a contact to view their details.
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const initials = `${selectedContact.firstName?.[0] || ""}${selectedContact.lastName?.[0] || ""}`.toUpperCase();

    const lastMessage = conversation.length
        ? conversation[conversation.length - 1]
        : null;

    const lastEmail = emailMessages.length
        ? emailMessages[emailMessages.length - 1]
        : null;

    const tagList = selectedContact.tags
        ? selectedContact.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : [];

    return (
        <Card className="crm-card page-panel-contacts-secondary border-0 mb-3">
            <Card.Body>
                <div className="d-flex align-items-start gap-3 flex-wrap">
                    <div className="contact-avatar">
                        {initials || "?"}
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <div>
                                <h5 className="mb-1 d-flex align-items-center gap-2">
                                    <FaUser className="text-primary" />
                                    {selectedContact.firstName} {selectedContact.lastName}
                                </h5>

                                <div className="mb-1 d-flex align-items-center gap-2">
                                    <FaPhone className="text-muted" />
                                    <span>{selectedContact.phone}</span>
                                </div>

                                {selectedContact.email && (
                                    <div className="mb-2 d-flex align-items-center gap-2">
                                        <FaEnvelope className="text-muted" />
                                        <span>{selectedContact.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="contact-metrics">
                                <div className="contact-metric-box">
                                    <div className="contact-metric-value">{conversation.length}</div>
                                    <div className="contact-metric-label">SMS</div>
                                </div>
                                <div className="contact-metric-box">
                                    <div className="contact-metric-value">{emailMessages.length}</div>
                                    <div className="contact-metric-label">Emails</div>
                                </div>
                            </div>
                        </div>

                        {tagList.length > 0 && (
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                                <FaTag className="text-muted" />
                                {tagList.map(tag => (
                                    <Badge
                                        key={tag}
                                        bg="secondary"
                                        className="contact-tag-badge"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {selectedContact.notes && (
                            <div className="contact-notes-box mt-2 mb-3">
                                <div className="fw-semibold d-flex align-items-center gap-2 mb-1">
                                    <FaStickyNote className="text-warning" />
                                    Notes
                                </div>
                                <div className="contact-notes-text">
                                    {selectedContact.notes}
                                </div>
                            </div>
                        )}

                        <div className="mb-3">
                            <Button
                                size="sm"
                                variant="outline-primary"
                                disabled={loadingSummary}
                                onClick={async () => {
                                    setLoadingSummary(true);
                                    setAiSummary("");
                                    try {
                                        const result = await generateContactSummary({
                                            contact: selectedContact,
                                            messages: conversation,
                                            emails: emailMessages,
                                        });
                                        setAiSummary(result.summary || "No summary available.");
                                    } catch (error) {
                                        setAiSummary("Could not generate summary.");
                                    } finally {
                                        setLoadingSummary(false);
                                    }
                                }}
                            >
                                {loadingSummary ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Generating...
                                    </>
                                ) : (
                                    "✨ Generate AI Summary"
                                )}
                            </Button>
                            {aiSummary && (
                                <div className="contact-ai-summary mt-2 p-2 rounded bg-light small">
                                    {aiSummary}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <Button
                                size="sm"
                                variant="outline-success"
                                disabled={loadingTags}
                                onClick={async () => {
                                    setLoadingTags(true);
                                    setSuggestedTags([]);
                                    try {
                                        const result = await autoTagContact({
                                            contact: selectedContact,
                                            messages: conversation,
                                            emails: emailMessages,
                                        });
                                        setSuggestedTags(Array.isArray(result.tags) ? result.tags : []);
                                    } catch (error) {
                                        setSuggestedTags([]);
                                    } finally {
                                        setLoadingTags(false);
                                    }
                                }}
                            >
                                {loadingTags ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Suggesting...
                                    </>
                                ) : (
                                    "🏷️ Suggest Tags"
                                )}
                            </Button>
                            {suggestedTags.length > 0 && (
                                <div className="mt-2">
                                    <div className="small text-muted mb-1">Suggested tags:</div>
                                    <div className="d-flex flex-wrap gap-1">
                                        {suggestedTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                bg="info"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => {
                                                    const current = selectedContact.tags || "";
                                                    const tags = current.split(",").map((t) => t.trim()).filter(Boolean);
                                                    if (!tags.includes(tag)) {
                                                        tags.push(tag);
                                                        // Update contact tags via API
                                                        const updated = tags.join(", ");
                                                        // We can't update contact directly from here, so just show
                                                        alert(`Add tag "${tag}" to contact tags: ${updated}`);
                                                    }
                                                }}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="contact-activity-box">
                            <div className="fw-semibold d-flex align-items-center gap-2 mb-2">
                                <FaClock className="text-info" />
                                Recent Activity
                            </div>

                            <div className="activity-stack">
                                <div className="activity-item">
                                    <div className="fw-semibold d-flex align-items-center gap-2">
                                        <FaComments className="text-primary" />
                                        Last SMS
                                    </div>
                                    {lastMessage ? (
                                        <>
                                            <div className="small">{lastMessage.body}</div>
                                            <div className="text-muted small">
                                                {lastMessage.direction} •{" "}
                                                {new Date(lastMessage.createdAt).toLocaleString()}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-muted small">
                                            No recent SMS conversation yet.
                                        </div>
                                    )}
                                </div>

                                <div className="activity-item">
                                    <div className="fw-semibold d-flex align-items-center gap-2">
                                        <FaEnvelope className="text-success" />
                                        Last Email
                                    </div>
                                    {lastEmail ? (
                                        <>
                                            <div className="small">
                                                <strong>{lastEmail.subject}</strong>
                                            </div>
                                            <div className="small">{lastEmail.body}</div>
                                            <div className="text-muted small">
                                                email • {new Date(lastEmail.createdAt).toLocaleString()}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-muted small">
                                            No recent email activity yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default ContactSummaryCard;
