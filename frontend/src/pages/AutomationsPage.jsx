import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { fetchAutoResponders, updateAutoResponder } from "../api/api";

function AutomationsPage({ theme, onToggleTheme, alert }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchAutoResponders();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load automations.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function getItem(type) {
        return items.find((i) => i.type === type);
    }

    async function save(type, payload) {
        setSaving(type);
        setError("");
        try {
            const updated = await updateAutoResponder(type, payload);
            setItems((prev) => prev.map((i) => (i.type === type ? updated : i)));
        } catch (e) {
            setError(e.message || "Save failed.");
        } finally {
            setSaving("");
        }
    }

    const ooo = getItem("out_of_office");
    const ah = getItem("after_hours");
    const bd = getItem("birthday");

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Automations" subtitle="Configure auto-responders and birthday greetings (SMS + Email)." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <Spinner animation="border" />
            ) : (
                <>
                    <Row className="g-4">
                        {/* Out of Office */}
                        <Col md={6}>
                            <Card className="crm-card border-0">
                                <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                                    <span>Out-of-Office Responder</span>
                                    <Form.Check
                                        type="switch"
                                        label={ooo?.active ? "Active" : "Inactive"}
                                        checked={!!ooo?.active}
                                        onChange={(e) => save("out_of_office", { active: e.target.checked })}
                                    />
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">Start Date</Form.Label>
                                        <Form.Control type="date" value={ooo?.startDate ? new Date(ooo.startDate).toISOString().slice(0, 10) : ""} onChange={(e) => save("out_of_office", { startDate: e.target.value || null })} />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">End Date</Form.Label>
                                        <Form.Control type="date" value={ooo?.endDate ? new Date(ooo.endDate).toISOString().slice(0, 10) : ""} onChange={(e) => save("out_of_office", { endDate: e.target.value || null })} />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">SMS Message</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={ooo?.smsMessage || ""} onChange={(e) => save("out_of_office", { smsMessage: e.target.value })} placeholder="We are out of the office. We'll get back to you soon." />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">Email Message</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={ooo?.emailMessage || ""} onChange={(e) => save("out_of_office", { emailMessage: e.target.value })} placeholder="We are out of the office. We'll get back to you soon." />
                                    </Form.Group>
                                    {saving === "out_of_office" && <span className="small text-muted">Saving...</span>}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* After Hours */}
                        <Col md={6}>
                            <Card className="crm-card border-0">
                                <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                                    <span>After-Hours Responder</span>
                                    <Form.Check
                                        type="switch"
                                        label={ah?.active ? "Active" : "Inactive"}
                                        checked={!!ah?.active}
                                        onChange={(e) => save("after_hours", { active: e.target.checked })}
                                    />
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">Start Time (after this hour)</Form.Label>
                                        <Form.Control type="time" value={ah?.startTime || "17:00"} onChange={(e) => save("after_hours", { startTime: e.target.value })} />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">End Time (before this hour)</Form.Label>
                                        <Form.Control type="time" value={ah?.endTime || "09:00"} onChange={(e) => save("after_hours", { endTime: e.target.value })} />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">SMS Message</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={ah?.smsMessage || ""} onChange={(e) => save("after_hours", { smsMessage: e.target.value })} placeholder="We are currently closed. We'll respond during business hours." />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small fw-semibold">Email Message</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={ah?.emailMessage || ""} onChange={(e) => save("after_hours", { emailMessage: e.target.value })} placeholder="We are currently closed. We'll respond during business hours." />
                                    </Form.Group>
                                    {saving === "after_hours" && <span className="small text-muted">Saving...</span>}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Birthday Greeting */}
                        <Col md={12}>
                            <Card className="crm-card border-0">
                                <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                                    <span>Birthday Greeting</span>
                                    <Form.Check
                                        type="switch"
                                        label={bd?.active ? "Active" : "Inactive"}
                                        checked={!!bd?.active}
                                        onChange={(e) => save("birthday", { active: e.target.checked })}
                                    />
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-semibold">Send Time</Form.Label>
                                                <Form.Control type="time" value={bd?.sendTime || "09:00"} onChange={(e) => save("birthday", { sendTime: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-semibold">SMS Message</Form.Label>
                                                <Form.Control as="textarea" rows={2} value={bd?.smsMessage || ""} onChange={(e) => save("birthday", { smsMessage: e.target.value })} placeholder="Happy Birthday {{firstName}}! 🎉" />
                                            </Form.Group>
                                            <Form.Group className="mb-2">
                                                <Form.Label className="small fw-semibold">Email Message</Form.Label>
                                                <Form.Control as="textarea" rows={2} value={bd?.emailMessage || ""} onChange={(e) => save("birthday", { emailMessage: e.target.value })} placeholder="Happy Birthday {{firstName}}! 🎉" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    {saving === "birthday" && <span className="small text-muted">Saving...</span>}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <p className="small text-muted mt-3">
                        Note: Auto-responders are configured here. SMS sending requires Twilio to be configured (currently in mock mode). Birthday emails are sent automatically by the daily scheduler at 9 AM ET.
                    </p>
                </>
            )}
        </AppLayout>
    );
}

export default AutomationsPage;
