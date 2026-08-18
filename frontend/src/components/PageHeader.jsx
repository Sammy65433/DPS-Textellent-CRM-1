import { Row, Col } from "react-bootstrap";

function PageHeader({ title, subtitle, action }) {
    return (
        <Row className="align-items-center mb-4 page-header">
            <Col>
                <h2 className="page-title">{title}</h2>
                {subtitle && <p className="page-subtitle mb-0">{subtitle}</p>}
            </Col>

            {action && (
                <Col xs="auto" className="page-header-action">
                    {action}
                </Col>
            )}
        </Row>
    );
}

export default PageHeader;
