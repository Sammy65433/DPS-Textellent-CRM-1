import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import AppLayout from "./AppLayout";

const API_URL = import.meta.env.VITE_DPS_API_URL;

export default function Booking({ theme, onToggleTheme }) {
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAppointments() {
            try {
                if (!API_URL) throw new Error("VITE_DPS_API_URL is not configured.");

                const response = await fetch(`${API_URL}/api/appointments`);
                if (!response.ok) throw new Error("Could not load appointments.");

                const data = await response.json();
                setAppointments(Array.isArray(data) ? data : data.appointments ?? []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadAppointments();
    }, []);

    const dailyAppointments = useMemo(
        () =>
            appointments
                .filter((appointment) => appointment.appointment_date === selectedDate)
                .sort((a, b) =>
                    (a.appointment_time ?? "").localeCompare(b.appointment_time ?? "")
                ),
        [appointments, selectedDate]
    );

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <Container fluid>
                <Row className="align-items-center mb-3">
                    <Col>
                        <h1>Booking Calendar</h1>
                        <p className="text-muted">
                            Appointments booked through the DPS website.
                        </p>
                    </Col>
                    <Col xs="auto">
                        <Button
                            href="https://www.dpstaxpro.com/booking"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Book an Appointment
                        </Button>
                    </Col>
                </Row>

                <Card>
                    <Card.Body>
                        <label htmlFor="booking-date" className="form-label fw-bold">
                            Select a date
                        </label>
                        <input
                            id="booking-date"
                            type="date"
                            className="form-control mb-4"
                            style={{ maxWidth: 240 }}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />

                        {loading && <Spinner animation="border" />}
                        {error && <Alert variant="danger">{error}</Alert>}

                        {!loading && !error && dailyAppointments.length === 0 && (
                            <p>No appointments for this date.</p>
                        )}

                        {!loading &&
                            !error &&
                            dailyAppointments.map((appointment) => (
                                <Card key={appointment.id} className="mb-2">
                                    <Card.Body>
                                        <strong>{appointment.appointment_time}</strong>{" "}
                                        {appointment.first_name} {appointment.last_name}
                                        <div>{appointment.service}</div>
                                        <div>Preparer: {appointment.tax_preparer}</div>
                                        <Badge bg="secondary">
                                            {appointment.status ?? "booked"}
                                        </Badge>
                                    </Card.Body>
                                </Card>
                            ))}
                    </Card.Body>
                </Card>
            </Container>
        </AppLayout>
    );
}
