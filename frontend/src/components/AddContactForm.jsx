import { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";

function AddContactForm({
    contactForm,
    setContactForm,
    onCreateContact,
    isEditing,
    onCancelEdit,
}) {
    const [cfKey, setCfKey] = useState("");
    const [cfValue, setCfValue] = useState("");

    function addCustomField() {
        const key = cfKey.trim();
        const value = cfValue.trim();
        if (!key) return;
        setContactForm((prev) => ({
            ...prev,
            customFields: { ...(prev.customFields || {}), [key]: value },
        }));
        setCfKey("");
        setCfValue("");
    }

    function removeCustomField(key) {
        setContactForm((prev) => {
            const next = { ...(prev.customFields || {}) };
            delete next[key];
            return { ...prev, customFields: next };
        });
    }

    return (
        <Card className="crm-card page-panel-contacts border-0 shadow-sm mb-4">
            <Card.Header className="card-header-clean">
                {isEditing ? "Edit Contact" : "Add Contact"}
            </Card.Header>

            <Card.Body>
                <Form onSubmit={onCreateContact}>
                    <Form.Control
                        className="mb-2"
                        placeholder="First name"
                        value={contactForm.firstName}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, firstName: e.target.value }))
                        }
                    />

                    <Form.Control
                        className="mb-2"
                        placeholder="Last name"
                        value={contactForm.lastName}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, lastName: e.target.value }))
                        }
                    />

                    <Form.Control
                        className="mb-2"
                        placeholder="Phone"
                        value={contactForm.phone}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, phone: e.target.value }))
                        }
                    />

                    <Form.Control
                        className="mb-2"
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, email: e.target.value }))
                        }
                    />

                    <Form.Control
                        className="mb-2"
                        type="date"
                        placeholder="Birthday"
                        value={contactForm.birthday || ""}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, birthday: e.target.value }))
                        }
                    />

                    <Form.Control
                        className="mb-2"
                        placeholder="Tags (comma separated)"
                        value={contactForm.tags}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, tags: e.target.value }))
                        }
                    />

                    <Form.Control
                        as="textarea"
                        rows={4}
                        className="mb-2"
                        placeholder="Notes"
                        value={contactForm.notes}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, notes: e.target.value }))
                        }
                    />
                    <div className="booking-note-suggestions mb-3">
                        {[
                            "Client needs follow-up on missing documents",
                            "First-time filer",
                            "Referred by existing client",
                            "Prefers phone contact",
                            "Has complex return - schedule extra time",
                            "Signed up but never booked",
                            "Filed last year - remind to file this year",
                        ].map((tip) => (
                            <button
                                key={tip}
                                type="button"
                                className="booking-note-chip"
                                onClick={() => setContactForm(prev => ({ ...prev, notes: prev.notes ? prev.notes + " " + tip : tip }))}
                            >
                                {tip}
                            </button>
                        ))}
                    </div>

                    <div className="mb-3">
                        <div className="fw-semibold small mb-1">Custom Fields</div>
                        {Object.entries(contactForm.customFields || {}).map(([k, v]) => (
                            <div key={k} className="d-flex gap-2 mb-1 align-items-center">
                                <Form.Control size="sm" value={k} readOnly />
                                <Form.Control size="sm" value={v} readOnly />
                                <Button size="sm" variant="outline-danger" onClick={() => removeCustomField(k)}>
                                    ×
                                </Button>
                            </div>
                        ))}
                        <div className="d-flex gap-2">
                            <Form.Control
                                size="sm"
                                placeholder="Field name"
                                value={cfKey}
                                onChange={(e) => setCfKey(e.target.value)}
                            />
                            <Form.Control
                                size="sm"
                                placeholder="Value"
                                value={cfValue}
                                onChange={(e) => setCfValue(e.target.value)}
                            />
                            <Button size="sm" variant="outline-primary" onClick={addCustomField}>
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Button type="submit" variant="dark" className="w-100">
                            {isEditing ? "Update Contact" : "Add Contact"}
                        </Button>

                        {isEditing && (
                            <Button
                                type="button"
                                variant="outline-secondary"
                                onClick={onCancelEdit}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddContactForm;
