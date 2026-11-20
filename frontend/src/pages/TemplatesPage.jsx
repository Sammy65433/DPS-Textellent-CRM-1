import { Alert, Row, Col, Card, Button, Badge, Form, Dropdown } from "react-bootstrap";
import { FaFileAlt, FaTags, FaEye, FaLightbulb, FaMagic, FaBullhorn, FaEnvelope, FaCommentDots, FaCalendarCheck } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { generateCampaignCopy } from "../api/api";

const COMPANY_INFO = {
    name: "DPS Professional Tax Services",
    phone: "(973) 327-2340",
    email: "info@DPStaxpro.com",
    email2: "DpsTax1@gmail.com",
    address: "1811 Springfield Ave, Maplewood, NJ",
    website: "https://www.dpstaxpro.com",
};

function TemplatesPage({
    theme,
    onToggleTheme,
    alert,
    templates,
    templateForm,
    setTemplateForm,
    onCreateTemplate,
    onDeleteTemplate,
}) {
    const navigate = useNavigate();
    const [showAI, setShowAI] = useState(false);
    const [aiGoal, setAiGoal] = useState("");
    const [aiTone, setAiTone] = useState("professional and friendly");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState("");

    const previewBody =
        templateForm.body || "Your live template preview will appear here.";

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Templates"
                subtitle="Create reusable SMS and email templates for outreach and campaigns."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <Row className="g-4">
                <Col lg={5}>
                    <Card className="crm-card page-panel-templates border-0" data-tour="templates-form">
                        <Card.Header className="card-header-clean d-flex align-items-center gap-2">
                            <FaFileAlt className="text-warning" />
                            Create Template
                        </Card.Header>

                        <Card.Body>
                            <Form onSubmit={onCreateTemplate}>
                                <Form.Control
                                    className="mb-2"
                                    placeholder="Template name"
                                    value={templateForm.name}
                                    onChange={e =>
                                        setTemplateForm(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />

                                <Form.Select
                                    className="mb-2"
                                    value={templateForm.category}
                                    onChange={e =>
                                        setTemplateForm(prev => ({
                                            ...prev,
                                            category: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="general">General</option>
                                    <option value="tax">Tax</option>
                                    <option value="real-estate">Real Estate</option>
                                    <option value="follow-up">Follow-Up</option>
                                    <option value="reminder">Reminder</option>
                                    <option value="marketing">Marketing</option>
                                </Form.Select>

                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    className="mb-3"
                                    placeholder="Template body"
                                    value={templateForm.body}
                                    onChange={e =>
                                        setTemplateForm(prev => ({
                                            ...prev,
                                            body: e.target.value,
                                        }))
                                    }
                                />

                                <div className="template-helper-box mb-3">
                                    <div className="fw-semibold d-flex align-items-center gap-2 mb-2">
                                        <FaLightbulb className="text-warning" />
                                        Available Placeholders
                                    </div>
                                    <div className="small">
                                        <code>{"{{firstName}}"}</code>{" "}
                                        <code>{"{{lastName}}"}</code>{" "}
                                        <code>{"{{fullName}}"}</code>{" "}
                                        <code>{"{{companyName}}"}</code>{" "}
                                        <code>{"{{companyPhone}}"}</code>{" "}
                                        <code>{"{{companyEmail}}"}</code>{" "}
                                        <code>{"{{companyAddress}}"}</code>{" "}
                                        <code>{"{{companyWebsite}}"}</code>
                                    </div>
                                </div>

                                <div className="template-helper-box mb-3">
                                    <div className="fw-semibold d-flex align-items-center gap-2 mb-2">
                                        <FaLightbulb className="text-warning" />
                                        Company Info (DPS)
                                    </div>
                                    <div className="small">
                                        <div><strong>Name:</strong> {COMPANY_INFO.name}</div>
                                        <div><strong>Phone:</strong> {COMPANY_INFO.phone}</div>
                                        <div><strong>Email:</strong> {COMPANY_INFO.email}</div>
                                        <div><strong>Email 2:</strong> {COMPANY_INFO.email2}</div>
                                        <div><strong>Address:</strong> {COMPANY_INFO.address}</div>
                                        <div><strong>Website:</strong> {COMPANY_INFO.website}</div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <Button
                                        type="button"
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => setShowAI((v) => !v)}
                                    >
                                        {showAI ? "Hide AI Generator" : "✨ AI Generate Template"}
                                    </Button>
                                </div>

                                {showAI && (
                                    <Card className="border-0 bg-light mb-3">
                                        <Card.Body>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-semibold">
                                                    What should this template say?
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="e.g. Welcome new clients and ask them to upload their tax documents"
                                                    value={aiGoal}
                                                    onChange={(e) => setAiGoal(e.target.value)}
                                                />
                                            </Form.Group>

                                            <div className="d-flex gap-2 mb-2">
                                                <Form.Select
                                                    size="sm"
                                                    value={aiTone}
                                                    onChange={(e) => setAiTone(e.target.value)}
                                                >
                                                    <option value="professional and friendly">Professional</option>
                                                    <option value="warm and casual">Warm & casual</option>
                                                    <option value="urgent">Urgent</option>
                                                </Form.Select>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                className="w-100 mb-2"
                                                disabled={aiLoading || !aiGoal.trim()}
                                                onClick={async () => {
                                                    setAiLoading(true);
                                                    setAiMessage("");
                                                    try {
                                                        const result = await generateCampaignCopy({
                                                            audience: "CRM contacts",
                                                            goal: aiGoal.trim(),
                                                            tone: aiTone,
                                                        });
                                                        setTemplateForm((prev) => ({
                                                            ...prev,
                                                            body: result.body || prev.body,
                                                            name: prev.name || `AI: ${aiGoal.trim().slice(0, 30)}`,
                                                        }));
                                                        setAiMessage("Template body generated! Edit as needed.");
                                                    } catch (error) {
                                                        setAiMessage(error.message || "Generation failed.");
                                                    } finally {
                                                        setAiLoading(false);
                                                    }
                                                }}
                                            >
                                                {aiLoading ? "Generating..." : "Generate Template Body"}
                                            </Button>

                                            {aiMessage && (
                                                <div className="small text-muted">{aiMessage}</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                )}

                                <Card className="template-preview-card border-0 mb-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaEye className="text-primary" />
                                            <span className="fw-semibold">Live Preview</span>
                                        </div>

                                        <div className="template-preview-name mb-1">
                                            {templateForm.name || "Untitled Template"}
                                        </div>

                                        <div className="template-preview-body">{previewBody}</div>
                                    </Card.Body>
                                </Card>

                                <Button type="submit" variant="primary" className="w-100">
                                    Save Template
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card className="crm-card page-panel-templates-secondary border-0" data-tour="templates-list">
                        <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <FaTags className="text-warning" />
                                Saved Templates
                            </div>
                            <Badge bg="secondary">{templates.length}</Badge>
                        </Card.Header>

                        <Card.Body className="template-list-body">
                            {templates.length === 0 ? (
                                <div className="template-empty-state">
                                    No templates created yet.
                                </div>
                            ) : (
                                <div className="template-grid">
                                    {templates.map(template => (
                                        <Card
                                            key={template._id}
                                            className="template-item-card border-0"
                                        >
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start gap-3">
                                                    <div className="w-100">
                                                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                                            <h6 className="template-item-title mb-0">
                                                                {template.name}
                                                            </h6>
                                                            <Badge bg="secondary">
                                                                {template.category || "general"}
                                                            </Badge>
                                                        </div>

                                                        <p className="template-item-body mb-0">
                                                            {template.body}
                                                        </p>
                                                    </div>

                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle size="sm" variant="outline-secondary">
                                                            Actions
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
                                                            <Dropdown.Item onClick={() => navigate("/campaigns", { state: { templateId: template._id } })}>
                                                                <FaBullhorn className="me-2" /> Use for Campaign
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => navigate("/contacts", { state: { templateId: template._id, channel: "sms" } })}>
                                                                <FaCommentDots className="me-2" /> Send as SMS
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => navigate("/emails", { state: { templateId: template._id } })}>
                                                                <FaEnvelope className="me-2" /> Send as Email
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => navigate("/contacts", { state: { templateId: template._id, channel: "reminder" } })}>
                                                                <FaCalendarCheck className="me-2" /> Booking Reminder
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item className="text-danger" onClick={() => onDeleteTemplate(template._id)}>
                                                                Delete
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </AppLayout>
    );
}

export default TemplatesPage;
