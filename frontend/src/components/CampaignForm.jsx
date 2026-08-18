import { Card, Form, Button } from "react-bootstrap";

function CampaignForm({
    campaignForm,
    setCampaignForm,
    templates,
    contacts,
    onCreateCampaign,
    onToggleContact,
}) {
    return (
        <Card className="crm-card page-panel-campaigns border-0">
            <Card.Header className="card-header-clean">
                Create Campaign
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
                        className="mb-3"
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

                    <div className="campaign-contacts mb-3">
                        {contacts.map(contact => (
                            <Form.Check
                                key={contact._id}
                                type="checkbox"
                                label={`${contact.firstName} ${contact.lastName}`}
                                checked={campaignForm.contactIds.includes(contact._id)}
                                onChange={() => onToggleContact(contact._id)}
                            />
                        ))}
                    </div>

                    <Button type="submit" variant="success" className="w-100">
                        Create Campaign
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default CampaignForm;
