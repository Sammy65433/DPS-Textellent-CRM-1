import { useState } from "react";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaColumns,
  FaCalendarCheck,
  FaUsers,
  FaFileAlt,
  FaBullhorn,
  FaEnvelope,
  FaChartBar,
  FaSignOutAlt,
  FaUserShield,
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";

function AppLayout({ children, theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  let role = null;
  try {
    role = JSON.parse(localStorage.getItem("user") || "null")?.role;
  } catch {
    role = null;
  }

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    closeMenu();
    navigate("/login");
  };

  return (
    <>
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        expanded={menuOpen}
        className="crm-navbar shadow-sm mb-4"
      >
        <Container fluid>
          <Navbar.Brand className="fw-bold">DPS CRM</Navbar.Brand>

          {["staff", "admin"].includes(role) && (
            <span
              className="ms-2 px-3 py-1 rounded-pill fw-bold"
              style={{
                backgroundColor: "#fbbf24",
                color: "#111827",
                fontSize: "0.8rem",
              }}
            >
              {role === "admin" ? "Admin" : "Staff"}
            </span>
          )}

          <Navbar.Toggle
            aria-controls="crm-navbar-menu"
            onClick={() => setMenuOpen((open) => !open)}
          />

          <Navbar.Collapse id="crm-navbar-menu">
            <Nav className="ms-auto align-items-lg-center flex-wrap">
              <Nav.Link
                as={NavLink}
                to="/dashboard"
                end
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaColumns className="me-2" />
                Dashboard
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/contacts"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaUsers className="me-2" />
                Contacts
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/templates"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaFileAlt className="me-2" />
                Templates
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/campaigns"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaBullhorn className="me-2" />
                Campaigns
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/emails"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaEnvelope className="me-2" />
                Emails
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/analytics"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaChartBar className="me-2" />
                Analytics
              </Nav.Link>

              <Nav.Link
                as={NavLink}
                to="/booking"
                className="nav-router-link"
                onClick={closeMenu}
              >
                <FaCalendarCheck className="me-2" />
                Booking
              </Nav.Link>

              {role === "admin" && (
                <Nav.Link
                  as={NavLink}
                  to="/staff"
                  className="nav-router-link"
                  onClick={closeMenu}
                >
                  <FaUserShield className="me-2" />
                  Staff Management
                </Nav.Link>
              )}

              <Button
                variant="light"
                size="sm"
                className="logout-btn ms-lg-3 me-2"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>

              <div className="ms-lg-1">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="dashboard-shell">
        {children}
      </Container>
    </>
  );
}

export default AppLayout;
