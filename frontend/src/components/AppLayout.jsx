import { Container, Navbar, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import {
    FaColumns,
    FaUsers,
    FaFileAlt,
    FaBullhorn,
    FaEnvelope,
    FaChartBar,
} from "react-icons/fa";

import ThemeToggle from "./ThemeToggle";

function AppLayout({ children, theme, onToggleTheme }) {
    return (
        <>
            <Navbar bg="dark" variant="dark" className="crm-navbar shadow-sm mb-4">
                <Container fluid>
                    <Navbar.Brand className="fw-bold">DPS CRM</Navbar.Brand>
                    <Nav className="ms-auto align-items-center">
                        <Nav.Link as={NavLink} to="/" end className="nav-router-link">
                            <FaColumns className="me-2" />
                            Dashboard
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/contacts" className="nav-router-link">
                            <FaUsers className="me-2" />
                            Contacts
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/templates" className="nav-router-link">
                            <FaFileAlt className="me-2" />
                            Templates
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/campaigns" className="nav-router-link">
                            <FaBullhorn className="me-2" />
                            Campaigns
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/emails" className="nav-router-link">
                            <FaEnvelope className="me-2" />
                            Emails
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/analytics" className="nav-router-link">
                            <FaChartBar className="me-2" />
                            Analytics
                        </Nav.Link>

                        <div className="ms-3">
                            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                        </div>
                    </Nav>
                </Container>
            </Navbar>

            <Container fluid className="dashboard-shell">
                {children}
            </Container>
        </>
    );
}

export default AppLayout;
