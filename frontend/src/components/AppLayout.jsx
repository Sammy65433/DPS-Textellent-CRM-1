import { useEffect, useState } from "react";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
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
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaQuestionCircle,
  FaClock,
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import AIAssistant from "./AIAssistant";
import OnboardingTour from "./OnboardingTour";

function AppLayout({ children, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
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

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMobileOpen(false);
    navigate("/login");
  };

  const NavItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav-item${isActive ? " active" : ""}`
      }
      onClick={closeMobile}
    >
      <Icon className="sidebar-nav-icon" />
      {sidebarOpen && <span className="sidebar-nav-label">{label}</span>}
    </NavLink>
  );

  const sidebar = (
    <aside className={`crm-sidebar ${sidebarOpen ? "open" : "collapsed"} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="crm-sidebar__header">
        <img src="/dps-logo.png" alt="DPS" className="crm-sidebar__logo" />
        {sidebarOpen && <span className="crm-sidebar__brand">DPS CRM</span>}
        <button
          type="button"
          className="crm-sidebar__toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>

      <nav className="crm-sidebar__nav">
        {sidebarOpen && <div className="crm-sidebar__section">MAIN</div>}
        <NavItem to="/dashboard" icon={FaColumns} label="Dashboard" end />
        <NavItem to="/contacts" icon={FaUsers} label="Contacts" />
        <NavItem to="/templates" icon={FaFileAlt} label="Templates" />
        <NavItem to="/emails" icon={FaEnvelope} label="Emails" />

        {sidebarOpen && <div className="crm-sidebar__section">ACCELERATE</div>}
        <NavItem to="/media" icon={FaImage} label="Media" />
        <div className="sidebar-dropdown-group">
          <button
            type="button"
            className="sidebar-dropdown-toggle"
            onClick={() => setAutoOpen((v) => !v)}
          >
            <FaBullhorn className="sidebar-nav-icon" />
            {sidebarOpen && <span className="sidebar-nav-label">Automations</span>}
            {sidebarOpen && <span className="sidebar-dropdown-arrow">{autoOpen ? "▲" : "▼"}</span>}
          </button>
          {autoOpen && sidebarOpen && (
            <div className="sidebar-dropdown-items">
              <NavItem to="/campaigns" icon={FaBullhorn} label="Campaigns" />
              <NavItem to="/drip-campaigns" icon={FaPaperPlane} label="Drip Campaigns" />
              <NavItem to="/automations" icon={FaClock} label="Birthday Greeting" />
              <NavItem to="/automations" icon={FaClock} label="Out-of-Office" />
              <NavItem to="/automations" icon={FaClock} label="After-Hours" />
            </div>
          )}
        </div>
        <NavItem to="/booking" icon={FaCalendarCheck} label="Booking" />

        {sidebarOpen && <div className="crm-sidebar__section">ANALYZE</div>}
        <NavItem to="/analytics" icon={FaChartBar} label="Analytics" />

        {role === "admin" && (
          <>
            {sidebarOpen && <div className="crm-sidebar__section">ADMIN</div>}
            <NavItem to="/staff" icon={FaUserShield} label="Staff Management" />
          </>
        )}
      </nav>

      <div className="crm-sidebar__footer">
        {sidebarOpen && (
          <>
            <div className="crm-sidebar__user">
              <div className="crm-sidebar__avatar">
                {(userName?.[0] || "U").toUpperCase()}
              </div>
              <div className="crm-sidebar__user-info">
                <div className="crm-sidebar__user-name">{userName || "User"}</div>
                <div className="crm-sidebar__user-role">
                  {role === "admin" ? "Admin" : "Staff"}
                </div>
              </div>
            </div>
            <div className="crm-sidebar__extra-links">
              <button type="button" className="crm-sidebar__extra-link" onClick={() => { navigate("/staff"); closeMobile(); }}>
                <FaUserShield className="me-2" /> Settings
              </button>
              <button type="button" className="crm-sidebar__extra-link" onClick={() => { window.open("https://textellent.com/knowledge-base", "_blank"); }}>
                <FaQuestionCircle className="me-2" /> Help
              </button>
            </div>
          </>
        )}
        <button type="button" className="crm-sidebar__logout" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" />
          {sidebarOpen && "Logout"}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="crm-mobile-topbar d-lg-none">
        <button
          type="button"
          className="crm-mobile-topbar__toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>
        <img src="/dps-logo.png" alt="DPS" width={28} height={28} style={{ borderRadius: 6 }} />
        <span className="crm-mobile-topbar__brand">DPS CRM</span>
      </div>

      {mobileOpen && (
        <div className="crm-sidebar-backdrop d-lg-none" onClick={closeMobile} />
      )}

      {sidebar}

      <div className={`crm-main ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        {children}
      </div>

      <AIAssistant />
      <OnboardingTour />
    </>
  );
}

export default AppLayout;
