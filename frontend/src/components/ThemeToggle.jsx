import { Button } from "react-bootstrap";
import { FaMoon, FaSun } from "react-icons/fa";

function ThemeToggle({ theme, onToggle }) {
  return (
    <Button
      className="theme-toggle-btn d-inline-flex align-items-center justify-content-center gap-2"
      onClick={onToggle}
      type="button"
    >
      {theme === "dark" ? <FaSun /> : <FaMoon />}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}

export default ThemeToggle;
