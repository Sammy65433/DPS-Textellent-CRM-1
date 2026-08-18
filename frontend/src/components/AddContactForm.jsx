import { Card, Form, Button } from "react-bootstrap";

function AddContactForm({
    contactForm,
    setContactForm,
    onCreateContact,
    isEditing,
    onCancelEdit,
}) {
    return (
        <Card className="crm-card border-0 shadow-sm mb-4">
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
                        className="mb-3"
                        placeholder="Tags"
                        value={contactForm.tags}
                        onChange={e =>
                            setContactForm(prev => ({ ...prev, tags: e.target.value }))
                        }
                    />

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
