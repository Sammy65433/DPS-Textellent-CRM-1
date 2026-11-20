import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { fetchDripCampaigns, createDripCampaign, deleteDripCampaign, enrollDripCampaign } from "../api/api";

function DripCampaignsPage({ theme, onToggleTheme, alert, contacts = [] }) {
    const [drips, setDrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [steps, setSteps] = useState([{ delayDays: 0, subject: "", body: "" }]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [creating, setCreating] = useState(false);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchDripCampaigns();
            setDrips(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load drip campaigns.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function addStep() {
        setSteps((prev) => [...prev, { delayDays: 3, subject: "", body: "" }]);
    }

    function updateStep(idx, field, value) {
        setSteps((prev) => prev.map((st, i) => (i === idx ? { ...st, [field]: value } : st)));
    }

    function removeStep(idx) {
        setSteps((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!name.trim() || steps.length === 0) return;
        setCreating(true);
        setError("");
        try {
            const drip = await createDripCampaign({ name: name.trim(), steps, contactIds: selectedContacts, status: "active" });
            // enroll
            if (selectedContacts.length > 0) {
                await enrollDripCampaign(drip._id, selectedContacts);
            }
            setName("");
            setSteps([{ delayDays: 0, subject: "", body: "" }]);
            setSelectedContacts([]);
            await load();
        } catch (e) {
            setError(e.message || "Failed to create drip campaign.");
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this drip campaign?")) return;
        try {
            await deleteDripCampaign(id);
            setDrips((prev) => prev.filter((d) => d._id !== id));
        } catch (e) {
            setError(e.message || "Delete failed.");
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Drip Campaigns" subtitle="Send timed email sequences to selected contacts." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4">
                <Col md={5}>
                    <Card className="crm-card border-0">
                        <Card.Header className="card-header-clean">Create Drip Campaign</Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleCreate}>
                                <Form.Control
                                    className="mb-2"
                                    placeholder="Campaign name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {steps.map((step, idx) => (
                                    <div key={idx} className="border rounded p-2 mb-2">
                                        <div className="d-flex justify-content-between mb-1">
                                            <strong className="small">Step {idx + 1}</strong>
                                            {steps.length > 1 && (
                                                <Button size="sm" variant="outline-danger" onClick={() => removeStep(idx)}>
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                        <Form.Control
                                            className="mb-1"
                                            type="number"
                                            min={0}
                                            placeholder="Delay (days)"
                                            value={step.delayDays}
                                            onChange={(e) => updateStep(idx, "delayDays", Number(e.target.value))}
                                        />
                                        <Form.Control
                                            className="mb-1"
                                            placeholder="Subject"
                                            value={step.subject}
                                            onChange={(e) => updateStep(idx, "subject", e.target.value)}
                                        />
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Body (use {{firstName}})"
                                            value={step.body}
                                            onChange={(e) => updateStep(idx, "body", e.target.value)}
                                        />
                                    </div>
                                ))}
                                <Button type="button" size="sm" variant="outline-secondary" className="mb-2" onClick={addStep}>
                                    + Add Step
                                </Button>

                                <Form.Label className="small fw-semibold mt-2">Enroll Contacts</Form.Label>
                                <div style={{ maxHeight: 180, overflowY: "auto" }} className="border rounded p-2 mb-2">
                                    {contacts.map((c) => (
                                        <Form.Check
                                            key={c._id}
                                            type="checkbox"
                                            label={`${c.firstName} ${c.lastName}`}
                                            checked={selectedContacts.includes(c._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedContacts((prev) => [...prev, c._id]);
                                                else setSelectedContacts((prev) => prev.filter((id) => id !== c._id));
                                            }}
                                        />
                                    ))}
                                </div>

                                <Button type="submit" variant="success" className="w-100" disabled={creating}>
                                    {creating ? "Creating..." : "Create & Enroll"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={7}>
                    <Card className="crm-card border-0">
                        <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                            <span>Drip Campaigns</span>
                            <span className="badge bg-secondary">{drips.length}</span>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <Spinner animation="border" />
                            ) : drips.length === 0 ? (
                                <p className="text-muted">No drip campaigns yet.</p>
                            ) : (
                                drips.map((d) => (
                                    <div key={d._id} className="border rounded p-3 mb-2">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <strong>{d.name}</strong>
                                                <div className="small text-muted">
                                                    {d.steps.length} step(s) · {d.contactIds?.length || 0} contacts · {d.status}
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(d._id)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </AppLayout>
    );
}

export default DripCampaignsPage;
