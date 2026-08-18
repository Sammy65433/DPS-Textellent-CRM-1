import { Card, Form, Button } from "react-bootstrap";
import { FaEnvelope } from "react-icons/fa";

function EmailComposer({
    selectedContact,
    emailForm,
    setEmailForm,
    templates,
    onSendEmail,
}) {
    return (
        <Card className="crm-card border-0">
            <Card.Header className="card-header-clean">Send Email</Card.Header>
            <Card.Body>
                {!selectedContact ? (
                    <p className="text-muted mb-0">Select a contact to send an email.</p>
                ) : (
                    <Form onSubmit={onSendEmail}>
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

                        <div className="d-flex justify-content-end mt-3">
                            <Button type="submit" variant="primary">
                                <FaEnvelope className="me-2" />
                                Send Email
                            </Button>
                        </div>
                    </Form>
                )}
            </Card.Body>
        </Card>
    );
}

export default EmailComposer;
