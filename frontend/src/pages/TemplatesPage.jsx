import { Alert, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";
import { FaFileAlt, FaTags, FaEye, FaLightbulb } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";

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
                    <Card className="crm-card page-panel-templates border-0">
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
                                        <code>{"{{lastName}}"}</code>
                                    </div>
                                </div>

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
                    <Card className="crm-card page-panel-templates-secondary border-0">
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

                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => onDeleteTemplate(template._id)}
                                                    >
                                                        Delete
                                                    </Button>
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
