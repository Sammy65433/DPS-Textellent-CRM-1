import { Alert, Row, Col } from "react-bootstrap";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import CampaignForm from "../components/CampaignForm";
import CampaignList from "../components/CampaignList";

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
}) {
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
                    />
                </Col>
            </Row>
        </AppLayout>
    );
}

export default CampaignsPage;
