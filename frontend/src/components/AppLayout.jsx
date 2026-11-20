import { useEffect, useState } from "react";
import { Container, Navbar, Nav, Button, Dropdown } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaColumns,
  FaCalendarCheck,
  FaUsers,
  FaFileAlt,
  FaBullhorn,
  FaEnvelope,
  FaPaperPlane,
  FaImage,
  FaChartBar,
  FaSignOutAlt,
  FaUserShield,
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import AIAssistant from "./AIAssistant";
import OnboardingTour from "./OnboardingTour";

function AppLayout({ children, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState(
    () => JSON.parse(localStorage.getItem("user") || "null")?.role || null
  );
  const [userName, setUserName] = useState(
    () => JSON.parse(localStorage.getItem("user") || "null")?.name ||
          JSON.parse(localStorage.getItem("user") || "null")?.firstName ||
          null
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const api = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(/\/$/, "");
    fetch(`${api}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const stored = JSON.parse(localStorage.getItem("user") || "null") || {};
          localStorage.setItem("user", JSON.stringify({ ...stored, ...data.user }));
          setRole(data.user.role);
          setUserName(data.user.name || data.user.firstName || null);
        }
      })
      .catch(() => {});
  }, []);

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
          <Navbar.Brand className="fw-bold d-flex align-items-center gap-2">
              <img src="/dps-logo.png" alt="DPS" width={36} height={36} style={{ borderRadius: 8 }} />
              <span style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}>DPS CRM</span>
            </Navbar.Brand>

          {["staff", "admin"].includes(role) && (
            <div className="d-flex align-items-center gap-2 ms-2">
              {userName && (
                <span
                  className="fw-semibold d-none d-md-inline"
                  style={{ color: "#f97316", fontSize: "0.9rem" }}
                >
                  Welcome, {userName}
                </span>
              )}
              <span
                className="px-2 py-1 rounded-pill fw-bold"
                style={{
                  backgroundColor: "#fbbf24",
                  color: "#111827",
                  fontSize: "0.75rem",
                }}
              >
                {role === "admin" ? "Admin" : "Staff"}
              </span>
            </div>
          )}

          <Navbar.Toggle
            aria-controls="crm-navbar-menu"
            onClick={() => setMenuOpen((open) => !open)}
          />

          <Navbar.Collapse id="crm-navbar-menu">
            <Nav className="ms-auto align-items-lg-center">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="primary"
                  size="sm"
                  id="crm-menu-dropdown"
                  style={{
                    background: "linear-gradient(135deg, #0f5c54, #6e42a8)",
                    border: "none",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(15,92,84,0.35)",
                  }}
                >
                  ☰ Menu
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={NavLink} to="/dashboard" onClick={closeMenu}>
                    <FaColumns className="me-2" /> Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/contacts" onClick={closeMenu}>
                    <FaUsers className="me-2" /> Contacts
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/templates" onClick={closeMenu}>
                    <FaFileAlt className="me-2" /> Templates
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/campaigns" onClick={closeMenu}>
                    <FaBullhorn className="me-2" /> Campaigns
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/emails" onClick={closeMenu}>
                    <FaEnvelope className="me-2" /> Emails
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/media" onClick={closeMenu}>
                    <FaImage className="me-2" /> Media
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/drip-campaigns" onClick={closeMenu}>
                    <FaPaperPlane className="me-2" /> Drip Campaigns
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/analytics" onClick={closeMenu}>
                    <FaChartBar className="me-2" /> Analytics
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/booking" onClick={closeMenu}>
                    <FaCalendarCheck className="me-2" /> Booking
                  </Dropdown.Item>
                  {role === "admin" && (
                    <Dropdown.Item as={NavLink} to="/staff" onClick={closeMenu}>
                      <FaUserShield className="me-2" /> Staff Management
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="dashboard-shell">
        {children}
      </Container>

      <AIAssistant />

      <OnboardingTour />
    </>
  );
}

export default AppLayout;
