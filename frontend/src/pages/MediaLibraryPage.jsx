import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { FaTrash, FaUpload } from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { fetchMedia, uploadMedia, deleteMedia } from "../api/api";

function MediaLibraryPage({ theme, onToggleTheme, alert }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Media Library" subtitle="Upload and manage media files for campaigns and emails." />
            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="mb-3">
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
                <span className="small text-muted ms-2">Max 5MB per file.</span>
            </div>

            {loading ? (
                <Spinner animation="border" />
            ) : media.length === 0 ? (
                <p className="text-muted">No media files yet.</p>
            ) : (
                <Row className="g-3">
                    {media.map((m) => (
                        <Col md={3} key={m._id}>
                            <Card className="crm-card border-0">
                                <Card.Body className="p-2">
                                    {m.mimeType?.startsWith("image/") ? (
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
