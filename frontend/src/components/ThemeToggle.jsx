import { Button } from "react-bootstrap";
import { FaMoon, FaSun } from "react-icons/fa";

function ThemeToggle({ theme, onToggle }) {
    return (
        <Button
            variant="light"
            className="theme-toggle-btn"
            onClick={onToggle}
            type="button"
        >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
        </Button>
    );
}

export default ThemeToggle;
