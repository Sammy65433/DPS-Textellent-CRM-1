import { Card, ListGroup, Button, Badge } from "react-bootstrap";
import { FaPaperPlane, FaTrash, FaClock, FaUsers, FaEdit } from "react-icons/fa";

function CampaignList({
    campaigns,
    onSendCampaign,
    onDeleteCampaign,
    onEditCampaign,
}) {
    return (
        <Card className="crm-card page-panel-campaigns-secondary border-0">
            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                <span>Campaigns</span>
                <Badge bg="secondary">{campaigns.length}</Badge>
            </Card.Header>

            <ListGroup variant="flush">
                {campaigns.length === 0 ? (
                    <ListGroup.Item>No campaigns created yet.</ListGroup.Item>
                ) : (
                    campaigns.map(campaign => (
                        <ListGroup.Item
                            key={campaign._id}
                            className="campaign-list-item"
                        >
                            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                <div className="campaign-list-main">
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                        <div className="fw-semibold">{campaign.name}</div>

                                        <Badge
                                            bg={
                                                campaign.status === "sent"
                                                    ? "success"
                                                    : campaign.status === "scheduled"
                                                        ? "warning"
                                                        : "secondary"
                                            }
                                        >
                                            {campaign.status}
                                        </Badge>

                                        <Badge bg="info" text="dark">
                                            {campaign.type || "sms"}
                                        </Badge>
                                    </div>

                                    {campaign.subject && (
                                        <div className="small text-muted mb-1">
                                            <strong>Subject:</strong> {campaign.subject}
                                        </div>
                                    )}

                                    <div className="small text-muted d-flex align-items-center gap-3 flex-wrap">
                                        <span>
                                            <FaUsers className="me-1" />
                                            {campaign.contactIds?.length || 0} recipients
                                        </span>

                                        {campaign.scheduledAt && (
                                            <span className="scheduled-time">
                                                <FaClock className="me-1" />
                                                {new Date(campaign.scheduledAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="small text-muted mt-1">
                                        Created: {new Date(campaign.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <div className="d-flex gap-2 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() => onEditCampaign(campaign)}
                                    >
                                        <FaEdit className="me-1" />
                                        Edit
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="dark"
                                        onClick={() => onSendCampaign(campaign._id)}
                                        disabled={campaign.status === "sent"}
                                    >
                                        <FaPaperPlane className="me-1" />
                                        {campaign.status === "sent" ? "Sent" : "Send"}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => onDeleteCampaign(campaign._id)}
                                    >
                                        <FaTrash className="me-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))
                )}
            </ListGroup>
        </Card>
    );
}

export default CampaignList;
