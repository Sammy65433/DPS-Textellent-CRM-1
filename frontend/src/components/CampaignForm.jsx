import { Card, Form, Button, Badge } from "react-bootstrap";
import { useMemo, useState } from "react";
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
    contacts,
    onCreateCampaign,
    onToggleContact,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [tagFilter, setTagFilter] = useState("");

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

            return matchesSearch && matchesTag;
        });
    }, [contacts, searchTerm, tagFilter]);

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
            .replace(/{{lastName}}/g, previewContact.lastName || "");
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
        <Card className="crm-card page-panel-campaigns border-0">
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
                <Form onSubmit={onCreateCampaign}>
                    <Form.Control
                        className="mb-2"
                        placeholder="Campaign name"
                        value={campaignForm.name}
                        onChange={e =>
                            setCampaignForm(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />

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
                        <option value="sms">SMS Campaign</option>
                        <option value="email">Email Campaign</option>
                        <option value="both">SMS + Email Campaign</option>
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
