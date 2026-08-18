import { Card, ListGroup, Button } from "react-bootstrap";

function CampaignList({ campaigns, onSendCampaign, onDeleteCampaign }) {
    return (
        <Card className="crm-card page-panel-campaigns-secondary border-0">
            <Card.Header className="card-header-clean">Campaigns</Card.Header>

            <ListGroup variant="flush">
                {campaigns.map(campaign => (
                    <ListGroup.Item
                        key={campaign._id}
                        className="d-flex justify-content-between align-items-center"
                    >
                        <div>
                            <div className="fw-semibold">{campaign.name}</div>
                            <small>Status: {campaign.status}</small>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant="dark"
                                onClick={() => onSendCampaign(campaign._id)}
                            >
                                Send
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => onDeleteCampaign(campaign._id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
}

export default CampaignList;
