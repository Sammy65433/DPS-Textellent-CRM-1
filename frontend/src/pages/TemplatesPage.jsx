import { Alert, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { FaFileAlt, FaTags } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import TemplateForm from "../components/TemplateForm";

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
                            <TemplateForm
                                templateForm={templateForm}
                                setTemplateForm={setTemplateForm}
                                onCreateTemplate={onCreateTemplate}
                            />
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
                                                    <div>
                                                        <h6 className="template-item-title mb-2">
                                                            {template.name}
                                                        </h6>
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
