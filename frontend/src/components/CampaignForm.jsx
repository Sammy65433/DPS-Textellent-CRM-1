import { Card, Form, Button, Badge, Spinner } from "react-bootstrap";
import { useMemo, useState } from "react";
import { generateCampaignCopy, createTemplate, fetchTemplates } from "../api/api";
import {
    FaBullhorn,
    FaUsers,
    FaFilter,
    FaClock,
    FaFileAlt,
    FaEye,
} from "react-icons/fa";

function CampaignForm({
    campaignForm,
    setCampaignForm,
    templates,
    setTemplates,
    contacts,
    onCreateCampaign,
    onToggleContact,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAI, setShowAI] = useState(false);
    const [aiGoal, setAiGoal] = useState("");
    const [aiAudience, setAiAudience] = useState("all contacts");
    const [aiTone, setAiTone] = useState("professional and friendly");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const uniqueTags = useMemo(() => {
        const tags = contacts
            .flatMap(contact =>
                (contact.tags || "")
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(Boolean)
            );

        return [...new Set(tags)];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const fullName =
                `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
            const phone = (contact.phone || "").toLowerCase();
            const email = (contact.email || "").toLowerCase();
            const tags = (contact.tags || "").toLowerCase();

            const matchesSearch =
                fullName.includes(searchTerm.toLowerCase()) ||
                phone.includes(searchTerm.toLowerCase()) ||
                email.includes(searchTerm.toLowerCase()) ||
                tags.includes(searchTerm.toLowerCase());

            const matchesTag = tagFilter
                ? tags.split(",").map(tag => tag.trim()).includes(tagFilter.toLowerCase())
                : true;

            const created = contact.createdAt ? new Date(contact.createdAt) : null;
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            let matchesStatus = true;
            if (statusFilter === "recent") {
                matchesStatus = !!created && (now - created.getTime()) <= 30 * dayMs;
            } else if (statusFilter === "inactive") {
                matchesStatus = !created || (now - created.getTime()) > 90 * dayMs;
            } else if (statusFilter === "active") {
                matchesStatus = !!created && (now - created.getTime()) <= 90 * dayMs;
            }

            return matchesSearch && matchesTag && matchesStatus;
        });
    }, [contacts, searchTerm, tagFilter, statusFilter]);

    const allFilteredSelected =
        filteredContacts.length > 0 &&
        filteredContacts.every(contact =>
            campaignForm.contactIds.includes(contact._id)
        );

    const selectedTemplate = useMemo(() => {
        return templates.find(template => template._id === campaignForm.templateId);
    }, [templates, campaignForm.templateId]);

    const previewContact = useMemo(() => {
        const selected = contacts.find(contact =>
            campaignForm.contactIds.includes(contact._id)
        );
        return selected || filteredContacts[0] || null;
    }, [contacts, filteredContacts, campaignForm.contactIds]);

    const previewBody = useMemo(() => {
        const raw = selectedTemplate?.body || "";

        if (!raw) return "";

        if (!previewContact) return raw;

        return raw
            .replace(/{{firstName}}/g, previewContact.firstName || "")
            .replace(/{{lastName}}/g, previewContact.lastName || "")
            .replace(/{{fullName}}/g, `${previewContact.firstName || ""} ${previewContact.lastName || ""}`.trim());
    }, [selectedTemplate, previewContact]);

    const handleSelectAllFiltered = () => {
        if (allFilteredSelected) {
            setCampaignForm(prev => ({
                ...prev,
                contactIds: prev.contactIds.filter(
                    id => !filteredContacts.some(contact => contact._id === id)
                ),
            }));
        } else {
            const filteredIds = filteredContacts.map(contact => contact._id);
            setCampaignForm(prev => ({
                ...prev,
                contactIds: [...new Set([...prev.contactIds, ...filteredIds])],
            }));
        }
    };

    const typeVariant =
        campaignForm.type === "sms"
            ? "primary"
            : campaignForm.type === "email"
                ? "info"
                : "dark";

    return (
        <Card className="crm-card page-panel-campaigns border-0" data-tour="campaigns-form">
            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <FaBullhorn className="text-danger" />
                    Create Campaign
                </div>

                <Badge bg="secondary">
                    {campaignForm.contactIds.length} selected
                </Badge>
            </Card.Header>

            <Card.Body>
                <Form onSubmit={(e) => { setSubmitAttempted(true); onCreateCampaign(e); }}>
                    <Form.Control
                        className="mb-2"
                        placeholder="Campaign name"
                        value={campaignForm.name}
                        isInvalid={submitAttempted && !campaignForm.name?.trim()}
                        onChange={e =>
                            setCampaignForm(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />
                    {submitAttempted && !campaignForm.name?.trim() && (
                        <div className="invalid-feedback d-block">Campaign name is required.</div>
                    )}

                    <Form.Select
                        className="mb-2"
                        value={campaignForm.type}
                        onChange={e =>
                            setCampaignForm(prev => ({
                                ...prev,
                                type: e.target.value,
                            }))
                        }
                    >
                        <option value="both">SMS + Email Campaign</option>
                        <option value="sms">SMS Campaign</option>
                        <option value="email">Email Campaign</option>
                        
                    </Form.Select>

                    {(campaignForm.type === "email" || campaignForm.type === "both") && (
                        <Form.Control
                            className="mb-2"
                            placeholder="Email subject"
                            value={campaignForm.subject}
                            onChange={e =>
                                setCampaignForm(prev => ({
                                    ...prev,
                                    subject: e.target.value,
                                }))
                            }
                        />
                    )}

                    <Form.Control
                        className="mb-2"
                        as="textarea"
                        rows={3}
                        placeholder="Or type your message directly (overrides template)"
                        value={campaignForm.body || ""}
                        isInvalid={submitAttempted && !(campaignForm.body?.trim()) && !campaignForm.templateId}
                        onChange={e =>
                            setCampaignForm(prev => ({
                                ...prev,
                                body: e.target.value,
                            }))
                        }
                    />
                    {submitAttempted && !(campaignForm.body?.trim()) && !campaignForm.templateId && (
                        <div className="invalid-feedback d-block">Enter a message or choose a template.</div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-2" data-tour="campaigns-ai">
                        <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowAI((v) => !v)}
                        >
                            {showAI ? "Hide AI Generator" : "AI Generate Copy"}
                        </Button>
                    </div>

                    {showAI && (
                        <Card className="border-0 bg-light mb-3">
                            <Card.Body>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-semibold">Campaign goal</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="e.g. Remind clients about the April 15 tax deadline"
                                        value={aiGoal}
                                        onChange={(e) => setAiGoal(e.target.value)}
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2 mb-2">
                                    <Form.Select
                                        size="sm"
                                        value={aiAudience}
                                        onChange={(e) => setAiAudience(e.target.value)}
                                    >
                                        <option value="all contacts">All contacts</option>
                                        <option value="recent clients">Recent clients</option>
                                        <option value="inactive leads">Inactive leads</option>
                                    </Form.Select>

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
                                                audience: aiAudience,
                                                goal: aiGoal.trim(),
                                                tone: aiTone,
                                            });
                                            const created = await createTemplate({
                                                userId: "user123",
                                                name: `AI: ${aiGoal.trim().slice(0, 40)}`,
                                                category: "general",
                                                body: result.body || "",
                                            });
                                            if (setTemplates) {
                                                try {
                                                    const updated = await fetchTemplates();
                                                    setTemplates(Array.isArray(updated) ? updated : templates);
                                                } catch {
                                                    // ignore
                                                }
                                            }
                                            setCampaignForm((prev) => ({
                                                ...prev,
                                                templateId: created._id,
                                                subject: result.subject || prev.subject,
                                            }));
                                            setAiMessage("Template created and selected!");
                                        } catch (error) {
                                            setAiMessage(error.message || "Generation failed.");
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                >
                                    {aiLoading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-1" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate & Create Template"
                                    )}
                                </Button>

                                {aiMessage && (
                                    <div className="small text-muted">{aiMessage}</div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    <Form.Select
                        className="mb-2 template-select-compact"
                        value={campaignForm.templateId}
                        onChange={e =>
                            setCampaignForm(prev => ({
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

                    {selectedTemplate && (
                        <Card className="template-preview-card border-0 mb-3">
                            <Card.Body>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FaFileAlt className="text-warning" />
                                    <span className="fw-semibold">Template Preview</span>
                                </div>
                                <div className="template-preview-name mb-1">
                                    {selectedTemplate.name}
                                </div>
                                <div className="template-preview-body">
                                    {selectedTemplate.body}
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    <div className="small text-muted mb-2 d-flex align-items-center gap-2">
                        <FaClock />
                        Schedule for later
                    </div>

                    <Form.Control
                        className="mb-3"
                        type="datetime-local"
                        value={campaignForm.scheduledAt}
                        onChange={e =>
                            setCampaignForm(prev => ({
                                ...prev,
                                scheduledAt: e.target.value,
                            }))
                        }
                    />

                    <div className="small text-muted mb-2 d-flex align-items-center gap-2">
                        <FaFilter />
                        Filter Contacts
                    </div>

                    <Form.Control
                        className="mb-2"
                        placeholder="Search by name, phone, email, or tags"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <Form.Select
                        className="mb-2"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All contacts</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="recent">Recent</option>
                    </Form.Select>

                    <Form.Select
                        className="mb-3"
                        value={tagFilter}
                        onChange={e => setTagFilter(e.target.value)}
                    >
                        <option value="">Filter by tag</option>
                        {uniqueTags.map(tag => (
                            <option key={tag} value={tag}>
                                {tag}
                            </option>
                        ))}
                    </Form.Select>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="fw-semibold d-flex align-items-center gap-2">
                            <FaUsers />
                            Contacts ({filteredContacts.length} shown)
                        </small>
                        {submitAttempted && (!campaignForm.contactIds || campaignForm.contactIds.length === 0) && (
                            <div className="text-danger small">Select at least one contact.</div>
                        )}

                        <Button
                            type="button"
                            size="sm"
                            variant="outline-primary"
                            onClick={handleSelectAllFiltered}
                        >
                            {allFilteredSelected ? "Clear Filtered" : "Select Filtered"}
                        </Button>
                    </div>

                    <div className="campaign-contacts mb-3">
                        {filteredContacts.length === 0 ? (
                            <div className="text-muted small">No matching contacts found.</div>
                        ) : (
                            filteredContacts.map(contact => (
                                <Form.Check
                                    key={contact._id}
                                    type="checkbox"
                                    label={`${contact.firstName} ${contact.lastName}`}
                                    checked={campaignForm.contactIds.includes(contact._id)}
                                    onChange={() => onToggleContact(contact._id)}
                                />
                            ))
                        )}
                    </div>

                    <Card className="live-preview-card border-0 mb-3">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <FaEye className="text-primary" />
                                <span className="fw-semibold">Live Preview</span>
                            </div>

                            <div className="d-flex gap-2 flex-wrap mb-2">
                                <Badge bg={typeVariant}>{campaignForm.type || "sms"}</Badge>
                                <Badge bg="secondary">
                                    {campaignForm.contactIds.length} recipients
                                </Badge>
                                {campaignForm.scheduledAt && (
                                    <Badge bg="warning" text="dark">
                                        Scheduled
                                    </Badge>
                                )}
                            </div>

                            {campaignForm.subject &&
                                (campaignForm.type === "email" || campaignForm.type === "both") && (
                                    <div className="live-preview-subject mb-2">
                                        <strong>Subject:</strong> {campaignForm.subject}
                                    </div>
                                )}

                            <div className="live-preview-body">
                                {previewBody || "Choose a template to preview the campaign message."}
                            </div>

                            {previewContact && (
                                <div className="live-preview-footer mt-2">
                                    Previewing as:{" "}
                                    <strong>
                                        {previewContact.firstName} {previewContact.lastName}
                                    </strong>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Button type="submit" variant="success" className="w-100">
                        Create Campaign
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default CampaignForm;
