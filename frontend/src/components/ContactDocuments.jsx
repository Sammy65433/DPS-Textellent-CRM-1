import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Spinner } from "react-bootstrap";
import { fetchContactDocuments } from "../api/api";

const CRM_API = (import.meta.env.VITE_API_URL || "http://localhost:5002")
  .replace(/\/$/, "");

function formatSize(bytes) {
  const size = Number(bytes);
  return Number.isFinite(size) && size >= 0
    ? `${Math.ceil(size / 1024)} KB`
    : "Size unavailable";
}

function ContactDocuments({ contactId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setDocuments([]);
    setError("");

    if (!contactId) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    fetchContactDocuments(contactId)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Could not load documents.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [contactId]);

  async function handleDownload(item) {
  if (!contactId || !item?.id || downloadingId) return;

  setDownloadingId(item.id);
  setError("");

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Staff login required.");

    const response = await fetch(
      `${CRM_API}/api/staff/contacts/${encodeURIComponent(contactId)}/documents/${encodeURIComponent(item.id)}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Could not download document.");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = String(item.original_name || "document").replace(
      /[/\\\r\n]/g,
      "_"
    );
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (requestError) {
    setError(requestError.message || "Could not download document.");
  } finally {
    setDownloadingId(null);
  }
}

  return (
    <Card className="crm-card border-0 mb-3">
      <Card.Header className="card-header-clean d-flex justify-content-between">
        <span>Client Documents</span>
        <Badge bg="secondary">{documents.length}</Badge>
      </Card.Header>

      <Card.Body>
        <p className="text-muted small">
          Staff-only document list. Downloads are saved to your device.
        </p>

        {!contactId ? (
          <p className="text-muted mb-0">Select a contact.</p>
        ) : loading ? (
          <Spinner animation="border" size="sm" role="status">
            <span className="visually-hidden">Loading documents...</span>
          </Spinner>
        ) : (
          <>
            {error && (
              <Alert variant="warning" role="alert">
                {error}
              </Alert>
            )}

            {!error && documents.length === 0 && (
              <p className="text-muted mb-0">No documents listed.</p>
            )}

            {documents.length > 0 && (
              <ul className="list-unstyled mb-0">
                {documents.map((item) => (
                  <li
                    key={item.id}
                    className="border-bottom py-2 d-flex justify-content-between align-items-center gap-2"
                  >
                    <div>
                      <div className="fw-semibold">{item.original_name}</div>
                      <div className="text-muted small">
                        {item.mime_type} · {formatSize(item.file_size)} ·{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Date unavailable"}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline-primary"
                      disabled={Boolean(downloadingId)}
                      onClick={() => handleDownload(item)}
                    >
                      {downloadingId === item.id
                        ? "Downloading..."
                        : "Download"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default ContactDocuments;
