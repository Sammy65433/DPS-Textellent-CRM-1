import { Card, Table, Form, Button, Badge } from "react-bootstrap";
import { FaSearch, FaTimes } from "react-icons/fa";

function ContactsTable({
    contacts,
    selectedContact,
    onSelectContact,
    onEditContact,
    onDeleteContact,
    searchTerm,
    setSearchTerm,
}) {
    return (
        <Card className="crm-card border-0">
            <Card.Body className="p-0">
                <div className="contacts-controls-top-row d-flex align-items-center justify-content-between flex-wrap gap-2 p-3">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="search-wrapper d-flex align-items-center">
                            <FaSearch className="me-2 text-muted" />
                            <Form.Control
                                size="sm"
                                placeholder="Search contacts"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ maxWidth: 260 }}
                            />
                            {searchTerm && (
                                <Button size="sm" variant="outline-secondary" onClick={() => setSearchTerm("")} className="ms-1">
                                    <FaTimes />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Button size="sm" variant="light" onClick={() => { /* upload handled by parent */ }}>
                            Upload
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => { /* add handled by parent */ }}>
                            + Add
                        </Button>
                    </div>
                </div>

                <div className="contacts-table-wrapper" style={{ overflowX: "auto" }}>
                    <Table className="contacts-table table mb-0" size="sm">
                        <thead>
                            <tr>
                                <th></th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Notes</th>
                                <th>Mobile Phone</th>
                                <th>Tags</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-4 text-muted">
                                        No contacts found
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr
                                        key={contact._id}
                                        className={selectedContact?._id === contact._id ? "table-active" : ""}
                                        onClick={() => onSelectContact(contact)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>
                                            <Form.Check type="checkbox" onClick={(e) => e.stopPropagation()} />
                                        </td>
                                        <td>{contact.firstName}</td>
                                        <td>{contact.lastName}</td>
                                        <td>{contact.email}</td>
                                        <td className="text-truncate" style={{ maxWidth: 180 }}>{contact.notes}</td>
                                        <td>{contact.phone}</td>
                                        <td>
                                            {(contact.tags || "").split(",").filter(Boolean).map((t) => (
                                                <Badge key={t} bg="secondary" className="me-1">{t.trim()}</Badge>
                                            ))}
                                        </td>
                                        <td className="small text-muted">
                                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : ""}
                                        </td>
                                        <td>
                                            <Button size="sm" variant="link" onClick={(e) => { e.stopPropagation(); onEditContact(contact); }}>Edit</Button>
                                            <Button size="sm" variant="link" className="text-danger" onClick={(e) => { e.stopPropagation(); onDeleteContact(contact._id); }}>Delete</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
}

export default ContactsTable;
