import { Card, ListGroup, Button, Form, Badge, InputGroup } from "react-bootstrap";
import { FaSearch, FaTimes } from "react-icons/fa";

function ContactsList({
    contacts,
    selectedContact,
    onSelectContact,
    onEditContact,
    onDeleteContact,
    searchTerm,
    setSearchTerm,
}) {
    return (
        <Card className="crm-card page-panel-contacts border-0 h-100">
            <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                <span>Contacts</span>
                <Badge bg="secondary">{contacts.length}</Badge>
            </Card.Header>

            <Card.Body className="pb-2">
                <InputGroup className="mb-2">
                    <InputGroup.Text>
                        <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <Button
                            variant="outline-secondary"
                            onClick={() => setSearchTerm("")}
                        >
                            <FaTimes />
                        </Button>
                    )}
                </InputGroup>
            </Card.Body>

            <ListGroup variant="flush" className="contact-list">
                {contacts.length === 0 ? (
                    <ListGroup.Item>No contacts found.</ListGroup.Item>
                ) : (
                    contacts.map(contact => (
                        <ListGroup.Item
                            key={contact._id}
                            active={selectedContact?._id === contact._id}
                            className="contact-item"
                            onClick={() => onSelectContact(contact)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <div className="w-100">
                                    <div className="fw-semibold">
                                        {contact.firstName} {contact.lastName}
                                    </div>

                                    <div className="contact-phone">{contact.phone}</div>

                                    {contact.email && (
                                        <div className="text-muted small">{contact.email}</div>
                                    )}

                                    {contact.tags && (
                                        <div className="mt-1">
                                            {contact.tags.split(",").map(tag => (
                                                <Badge
                                                    key={tag.trim()}
                                                    bg="secondary"
                                                    className="me-1 contact-tag-badge"
                                                >
                                                    {tag.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

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
