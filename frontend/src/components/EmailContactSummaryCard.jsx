import { Card, Badge } from "react-bootstrap";
import {
    FaUser,
    FaPhone,
    FaEnvelope,
    FaTag,
    FaStickyNote,
    FaClock,
} from "react-icons/fa";

function EmailContactSummaryCard({ selectedContact, emailMessages = [] }) {
    if (!selectedContact) {
        return (
            <Card className="crm-card page-panel-emails-secondary border-0 mb-3">
                <Card.Body>
                    <div className="text-muted">
                        Select a contact to view their email profile.
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const initials = `${selectedContact.firstName?.[0] || ""}${selectedContact.lastName?.[0] || ""}`.toUpperCase();

    const lastEmail = emailMessages.length
        ? emailMessages[emailMessages.length - 1]
        : null;

    const tagList = selectedContact.tags
        ? selectedContact.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : [];

    return (
        <Card className="crm-card page-panel-emails-secondary border-0 mb-3">
            <Card.Body>
                <div className="d-flex align-items-start gap-3 flex-wrap">
                    <div className="contact-avatar email-avatar">
                        {initials || "?"}
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <div>
                                <h5 className="mb-1 d-flex align-items-center gap-2">
                                    <FaUser className="text-info" />
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
                                        className="me-1 contact-tag-badge"
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

                        <div className="contact-activity-box">
                            <div className="fw-semibold d-flex align-items-center gap-2 mb-2">
                                <FaClock className="text-info" />
                                Recent Email Activity
                            </div>

                            {lastEmail ? (
                                <div className="small">
                                    <div>
                                        <strong>Last Email:</strong> {lastEmail.subject}
                                    </div>
                                    <div>{lastEmail.body}</div>
                                    <div className="text-muted small">
                                        email • {new Date(lastEmail.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted small">
                                    No recent email activity yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default EmailContactSummaryCard;
