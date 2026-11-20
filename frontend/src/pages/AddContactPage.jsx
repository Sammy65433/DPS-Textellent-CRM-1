import { useState } from "react";
import { Alert, Button, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import AddContactForm from "../components/AddContactForm";

function AddContactPage({ theme, onToggleTheme, alert, contactForm, setContactForm, onCreateContact }) {
    const navigate = useNavigate();
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Add Contact" subtitle="Create a new contact in your CRM." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            <Row className="g-4">
                <Col md={6}>
                    <AddContactForm
                        contactForm={contactForm}
                        setContactForm={setContactForm}
                        onCreateContact={async (e) => {
                            await onCreateContact(e);
                            navigate("/contacts");
                        }}
                        isEditing={false}
                        onCancelEdit={() => navigate("/contacts")}
                    />
                </Col>
            </Row>
        </AppLayout>
    );
}

export default AddContactPage;
