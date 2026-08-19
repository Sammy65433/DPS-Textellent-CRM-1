import { Alert, Row, Col, Modal, Form, Button, Card, Badge } from "react-bootstrap";
import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import CampaignForm from "../components/CampaignForm";
import CampaignList from "../components/CampaignList";
import { FaFileAlt, FaClock, FaBullhorn, FaEye } from "react-icons/fa";

function CampaignsPage({
    theme,
    onToggleTheme,
    alert,
    campaigns,
    campaignForm,
    setCampaignForm,
    templates,
    contacts,
    onCreateCampaign,
    onToggleContact,
    onSendCampaign,
    onDeleteCampaign,
    onUpdateCampaign,
}) {
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        subject: "",
        type: "sms",
        templateId: "",
        scheduledAt: "",
        status: "draft",
    });

    const selectedEditTemplate = useMemo(() => {
        return templates.find(template => template._id === editForm.templateId);
    }, [templates, editForm.templateId]);

    const previewEditBody = useMemo(() => {
        if (!selectedEditTemplate) return "";
        const sampleContact =
            editingCampaign?.contactIds?.[0] && typeof editingCampaign.contactIds[0] === "object"
                ? editingCampaign.contactIds[0]
                : null;

        let body = selectedEditTemplate.body;

        if (sampleContact) {
            body = body
                .replace(/{{firstName}}/g, sampleContact.firstName || "")
                .replace(/{{lastName}}/g, sampleContact.lastName || "");
        }

        return body;
    }, [selectedEditTemplate, editingCampaign]);

    const handleOpenEdit = campaign => {
        setEditingCampaign(campaign);
        setEditForm({
            name: campaign.name || "",
            subject: campaign.subject || "",
            type: campaign.type || "sms",
            templateId: campaign.templateId?._id || campaign.templateId || "",
            scheduledAt: campaign.scheduledAt
                ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
                : "",
            status: campaign.status || "draft",
        });
    };

    const handleCloseEdit = () => {
        setEditingCampaign(null);
    };

    const handleSaveEdit = async e => {
        e.preventDefault();
        await onUpdateCampaign(editingCampaign._id, editForm);
        setEditingCampaign(null);
    };

    const statusVariant =
        editForm.status === "sent"
            ? "success"
            : editForm.status === "scheduled"
                ? "warning"
                : "secondary";

    const typeVariant =
        editForm.type === "sms"
            ? "primary"
            : editForm.type === "email"
                ? "info"
                : "dark";

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Campaigns"
                subtitle="Build and send message campaigns to selected contacts."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <Row className="g-4">
                <Col md={5}>
                    <CampaignForm
                        campaignForm={campaignForm}
                        setCampaignForm={setCampaignForm}
                        templates={templates}
                        contacts={contacts}
                        onCreateCampaign={onCreateCampaign}
                        onToggleContact={onToggleContact}
                    />
                </Col>

                <Col md={7}>
                    <CampaignList
                        campaigns={campaigns}
                        onSendCampaign={onSendCampaign}
                        onDeleteCampaign={onDeleteCampaign}
                        onEditCampaign={handleOpenEdit}
                    />
                </Col>
            </Row>

            <Modal
                show={!!editingCampaign}
                onHide={handleCloseEdit}
                centered
                size="lg"
            >
                <Modal.Header closeButton className="campaign-modal-header">
                    <div className="w-100 d-flex justify-content-between align-items-center pe-3">
                        <div>
                            <Modal.Title className="mb-1 d-flex align-items-center gap-2">
                                <FaBullhorn className="text-danger" />
                                Edit Campaign
                            </Modal.Title>
                            <div className="d-flex gap-2 flex-wrap">
                                <Badge bg={statusVariant}>{editForm.status}</Badge>
                                <Badge bg={typeVariant}>{editForm.type}</Badge>
                            </div>
                        </div>
                    </div>
                </Modal.Header>

                <Form onSubmit={handleSaveEdit}>
                    <Modal.Body className="campaign-modal-body">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="fw-semibold">Campaign Name</Form.Label>
                                <Form.Control
                                    placeholder="Campaign name"
                                    value={editForm.name}
                                    onChange={e =>
                                        setEditForm(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label className="fw-semibold">Campaign Type</Form.Label>
                                <Form.Select
                                    value={editForm.type}
                                    onChange={e =>
                                        setEditForm(prev => ({
                                            ...prev,
                                            type: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="sms">SMS Campaign</option>
                                    <option value="email">Email Campaign</option>
                                    <option value="both">SMS + Email Campaign</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label className="fw-semibold">Status</Form.Label>
                                <Form.Select
                                    value={editForm.status}
                                    onChange={e =>
                                        setEditForm(prev => ({
                                            ...prev,
                                            status: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="sent">Sent</option>
                                </Form.Select>
                            </Col>

                            {(editForm.type === "email" || editForm.type === "both") && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold">Email Subject</Form.Label>
                                    <Form.Control
                                        placeholder="Email subject"
                                        value={editForm.subject}
                                        onChange={e =>
                                            setEditForm(prev => ({
                                                ...prev,
                                                subject: e.target.value,
                                            }))
                                        }
                                    />
                                </Col>
                            )}

                            <Col md={12}>
                                <Form.Label className="fw-semibold">Template</Form.Label>
                                <Form.Select
                                    className="template-select-compact"
                                    value={editForm.templateId}
                                    onChange={e =>
                                        setEditForm(prev => ({
                                            ...prev,
                                            templateId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Choose template</option>
                                    {templates.map(template => (
                                        <option key={template._id} value={template._id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            {selectedEditTemplate && (
                                <Col md={12}>
                                    <Card className="template-preview-card border-0">
                                        <Card.Body>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <FaFileAlt className="text-warning" />
                                                <span className="fw-semibold">Template Preview</span>
                                            </div>
                                            <div className="template-preview-name mb-1">
                                                {selectedEditTemplate.name}
                                            </div>
                                            <div className="template-preview-body">
                                                {selectedEditTemplate.body}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            )}

                            <Col md={12}>
                                <Card className="live-preview-card border-0">
                                    <Card.Body>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaEye className="text-primary" />
                                            <span className="fw-semibold">Live Preview</span>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap mb-2">
                                            <Badge bg={typeVariant}>{editForm.type || "sms"}</Badge>
                                            <Badge bg={statusVariant}>{editForm.status}</Badge>
                                            {editingCampaign?.contactIds?.length > 0 && (
                                                <Badge bg="secondary">
                                                    {editingCampaign.contactIds.length} recipients
                                                </Badge>
                                            )}
                                            {editForm.scheduledAt && (
                                                <Badge bg="warning" text="dark">
                                                    Scheduled
                                                </Badge>
                                            )}
                                        </div>

                                        {editForm.subject &&
                                            (editForm.type === "email" || editForm.type === "both") && (
                                                <div className="live-preview-subject mb-2">
                                                    <strong>Subject:</strong> {editForm.subject}
                                                </div>
                                            )}

                                        <div className="live-preview-body">
                                            {previewEditBody ||
                                                "Choose a template to preview the campaign message."}
                                        </div>

                                        {editingCampaign?.contactIds?.[0] &&
                                            typeof editingCampaign.contactIds[0] === "object" && (
                                                <div className="live-preview-footer mt-2">
                                                    Previewing as:{" "}
                                                    <strong>
                                                        {editingCampaign.contactIds[0].firstName}{" "}
                                                        {editingCampaign.contactIds[0].lastName}
                                                    </strong>
                                                </div>
                                            )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={12}>
                                <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                                    <FaClock className="text-muted" />
                                    Scheduled Time
                                </Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={editForm.scheduledAt}
                                    onChange={e =>
                                        setEditForm(prev => ({
                                            ...prev,
                                            scheduledAt: e.target.value,
                                        }))
                                    }
                                />
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer className="campaign-modal-footer">
                        <Button variant="outline-secondary" onClick={handleCloseEdit}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </AppLayout>
    );
}

export default CampaignsPage;
