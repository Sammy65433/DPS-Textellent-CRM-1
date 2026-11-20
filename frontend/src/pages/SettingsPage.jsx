import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";

function SettingsPage({ theme, onToggleTheme }) {
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Settings" subtitle="Account and application settings." />
            <div className="crm-card border-0 p-4">
                <h5>Account</h5>
                <p className="text-muted small">Manage your profile, password, and preferences here.</p>
                <p className="small">For staff management (invite/deactivate), go to <a href="/staff">Staff Management</a>.</p>
                <h5 className="mt-3">Theme</h5>
                <p className="text-muted small">Use the theme toggle in the sidebar to switch between light and dark mode.</p>
            </div>
        </AppLayout>
    );
}

export default SettingsPage;
