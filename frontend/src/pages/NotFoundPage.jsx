import { Card } from "react-bootstrap";
import AppLayout from "../components/AppLayout";

function NotFoundPage({ theme, onToggleTheme }) {
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <Card className="crm-card border-0 p-4 text-center">
                <h2>404</h2>
                <p className="text-muted mb-0">
                    The page you’re looking for does not exist.
                </p>
            </Card>
        </AppLayout>
    );
}

export default NotFoundPage;
