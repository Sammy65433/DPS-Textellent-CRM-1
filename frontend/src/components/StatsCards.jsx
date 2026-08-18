import { Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
    FaUsers,
    FaComments,
    FaFileAlt,
    FaBullhorn,
    FaEnvelope,
} from "react-icons/fa";

function StatsCards({ contacts, messages, templates, campaigns, emails = [] }) {
    const cards = [
        {
            title: "Contacts",
            count: contacts.length,
            icon: <FaUsers />,
            colorClass: "stat-card-contacts",
            iconClass: "stat-icon-contacts",
            to: "/contacts",
        },
        {
            title: "Messages",
            count: messages.length,
            icon: <FaComments />,
            colorClass: "stat-card-messages",
            iconClass: "stat-icon-messages",
            to: "/contacts",
        },
        {
            title: "Templates",
            count: templates.length,
            icon: <FaFileAlt />,
            colorClass: "stat-card-templates",
            iconClass: "stat-icon-templates",
            to: "/templates",
        },
        {
            title: "Campaigns",
            count: campaigns.length,
            icon: <FaBullhorn />,
            colorClass: "stat-card-campaigns",
            iconClass: "stat-icon-campaigns",
            to: "/campaigns",
        },
        {
            title: "Emails",
            count: emails.length,
            icon: <FaEnvelope />,
            colorClass: "stat-card-emails",
            iconClass: "stat-icon-emails",
            to: "/emails",
        },
    ];

    return (
        <Row className="g-4 mb-4">
            {cards.map(card => (
                <Col md={6} lg={card.title === "Emails" ? 12 : 3} key={card.title}>
                    <Link to={card.to} className="stats-card-link">
                        <Card className={`dashboard-card border-0 ${card.colorClass}`}>
                            <Card.Body>
                                <div className={`dashboard-icon ${card.iconClass}`}>
                                    {card.icon}
                                </div>
                                <div className="dashboard-stat-label">{card.title}</div>
                                <h3 className="dashboard-stat-value">{card.count}</h3>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
            ))}
        </Row>
    );
}

export default StatsCards;
