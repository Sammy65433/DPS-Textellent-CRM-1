import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { FaSearch, FaTrash, FaUpload } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { fetchMedia, uploadMedia, deleteMedia } from "../api/api";

function MediaLibraryPage({ theme, onToggleTheme, alert }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchMedia();
            setMedia(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load media.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError("");
        try {
            const reader = new FileReader();
            const base64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            await uploadMedia(file.name, file.type || "application/octet-stream", base64);
            await load();
        } catch (e) {
            setError(e.message || "Upload failed.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this media file?")) return;
        try {
            await deleteMedia(id);
            setMedia((prev) => prev.filter((m) => m._id !== id));
        } catch (e) {
            setError(e.message || "Delete failed.");
        }
    }

    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

    function isImage(m) {
        if (m.mimeType?.startsWith("image/")) return true;
        return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(m.filename || "");
    }

    const filtered = media.filter((m) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (m.filename || "").toLowerCase().includes(q);
    });

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Media Library" subtitle="Upload and manage media files for campaigns and emails." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <FaSearch className="text-muted" />
                    <Form.Control
                        size="sm"
                        placeholder="Search by name or filename..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: 260 }}
                    />
                </div>
                <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                    <FaUpload className="me-2" />
                    {uploading ? "Uploading..." : "Upload File"}
                    <input
                        type="file"
                        style={{ display: "none" }}
                        disabled={uploading}
                        onChange={handleUpload}
                    />
                </label>
            </div>

            {loading ? (
                <Spinner animation="border" />
            ) : filtered.length === 0 ? (
                <p className="text-muted">No media files found.</p>
            ) : (
                <Row className="g-3">
                    {filtered.map((m) => (
                        <Col md={3} key={m._id}>
                            <Card className="crm-card border-0">
                                <Card.Body className="p-2">
                                    {isImage(m) ? (
                                        <img
                                            src={`${apiUrl}/api/media/${m._id}/file`}
                                            alt={m.filename}
                                            style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                                        />
                                    ) : (
                                        <div className="text-center py-4 text-muted small">{m.mimeType}</div>
                                    )}
                                    <div className="small mt-2 text-truncate" title={m.filename}>{m.filename}</div>
                                    <div className="small text-muted">{(m.size / 1024).toFixed(1)} KB</div>
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        className="mt-2 w-100"
                                        onClick={() => handleDelete(m._id)}
                                    >
                                        <FaTrash /> Delete
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </AppLayout>
    );
}

export default MediaLibraryPage;
