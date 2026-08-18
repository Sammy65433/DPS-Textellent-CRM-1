import { Card, ListGroup, Button } from "react-bootstrap";

function ContactsList({
    contacts,
    selectedContact,
    onSelectContact,
    onEditContact,
    onDeleteContact,
}) {
    return (
        <Card className="crm-card border-0 h-100">
            <Card.Header className="card-header-clean">Contacts</Card.Header>

            <ListGroup variant="flush" className="contact-list">
                {contacts.length === 0 ? (
                    <ListGroup.Item>No contacts yet.</ListGroup.Item>
                ) : (
                    contacts.map(contact => (
                        <ListGroup.Item
                            key={contact._id}
                            active={selectedContact?._id === contact._id}
                            className="contact-item"
                            onClick={() => onSelectContact(contact)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="fw-semibold">
                                {contact.firstName} {contact.lastName}
                            </div>
                            <div className="contact-phone">{contact.phone}</div>
                            {contact.email && (
                                <div className="text-muted small">{contact.email}</div>
                            )}
                            {contact.tags && (
                                <div className="text-muted small">Tags: {contact.tags}</div>
                            )}

                            <div
                                className="d-flex gap-2 mt-2"
                                onClick={e => e.stopPropagation()}
                            >
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => onEditContact(contact)}
                                >
                                    Edit
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => onDeleteContact(contact._id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))
                )}
            </ListGroup>
        </Card>
    );
}

export default ContactsList;
