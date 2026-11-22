import { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { FaEnvelope, FaMagic } from "react-icons/fa";
import { generateCampaignCopy, getSmartReplies } from "../api/api";

function EmailComposer({
    selectedContact,
    emailForm,
    setEmailForm,
    templates,
    onSendEmail,
    emailMessages = [],
}) {
    const [showAI, setShowAI] = useState(false);
    const [aiGoal, setAiGoal] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState("");
    const [smartReplies, setSmartReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [sentMsg, setSentMsg] = useState("");

    async function handleGenerate() {
        if (!aiGoal.trim()) return;
        setAiLoading(true);
        setAiMessage("");
        try {
            const result = await generateCampaignCopy({
                audience: selectedContact
                    ? `${selectedContact.firstName} ${selectedContact.lastName}`
                    : "client",
                goal: aiGoal.trim(),
                tone: "professional and friendly",
            });
            setEmailForm((prev) => ({
                ...prev,
                subject: result.subject || prev.subject,
                body: result.body || prev.body,
            }));
            setAiMessage("Generated! Review and edit before sending.");
        } catch (error) {
            setAiMessage(error.message || "Generation failed.");
        } finally {
            setAiLoading(false);
        }
    }

    async function loadSmartReplies() {
        if (!selectedContact) return;
        setLoadingReplies(true);
        try {
            const result = await getSmartReplies({
                contact: selectedContact,
                messages: emailMessages.map((e) => ({
                    direction: "inbound",
                    body: e.body,
                    createdAt: e.createdAt,
                })),
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
                <span>Send Email</span>
                {selectedContact && (
                    <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={loadingReplies}
                        onClick={loadSmartReplies}
                    >
                        {loadingReplies ? "Generating..." : "✨ Suggest Replies"}
                    </Button>
                )}
            </Card.Header>
            <Card.Body>
                {!selectedContact ? (
                    <p className="text-muted mb-0">Select a contact to send an email.</p>
                ) : (
                    <Form onSubmit={async (e) => { await onSendEmail(e); setSentMsg("Email sent successfully! ✅"); setTimeout(() => setSentMsg(""), 4000); }}>
                        <Form.Control
                            className="mb-2"
                            placeholder="To email"
                            value={emailForm.toEmail}
                            readOnly
                        />

                        <Form.Control
                            className="mb-2"
                            placeholder="Subject"
                            value={emailForm.subject}
                            onChange={e =>
                                setEmailForm(prev => ({
                                    ...prev,
                                    subject: e.target.value,
                                }))
                            }
                        />

                        <Form.Select
                            className="mb-2 template-select-compact"
                            value={emailForm.templateId}
                            onChange={e => {
                                const selectedId = e.target.value;
                                const selectedTemplate = templates.find(
                                    template => template._id === selectedId
                                );

                                setEmailForm(prev => ({
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
                            placeholder="Write email body"
                            value={emailForm.body}
                            onChange={e =>
                                setEmailForm(prev => ({
                                    ...prev,
                                    body: e.target.value,
                                }))
                            }
                        />

                        {smartReplies.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-2">
                                {smartReplies.map((reply, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={() =>
                                            setEmailForm((prev) => ({ ...prev, body: reply }))
                                        }
                                    >
                                        {reply}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {sentMsg && (
                            <div className="alert alert-success py-1 px-2 small mt-2 mb-2">{sentMsg}</div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setShowAI((v) => !v)}
                            >
                                {showAI ? "Hide AI Generator" : "✨ AI Generate Email"}
                            </Button>
                            <Button type="submit" variant="primary">
                                <FaEnvelope className="me-2" />
                                Send Email
                            </Button>
                        </div>

                        {showAI && (
                            <div className="mt-2 p-2 border rounded bg-light">
                                <Form.Control
                                    className="mb-2"
                                    placeholder="What should this email say? (e.g. remind about tax deadline)"
                                    value={aiGoal}
                                    onChange={(e) => setAiGoal(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={aiLoading || !aiGoal.trim()}
                                    onClick={handleGenerate}
                                >
                                    {aiLoading ? "Generating..." : "Generate"}
                                </Button>
                                {aiMessage && (
                                    <div className="small text-muted mt-1">{aiMessage}</div>
                                )}
                            </div>
                        )}
                    </Form>
                )}
            </Card.Body>
        </Card>
    );
}

export default EmailComposer;
