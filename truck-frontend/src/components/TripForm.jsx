import { useState } from "react";
import { Form, Button, Card, Row } from "react-bootstrap";

/**
 * Calculate distance in miles between two coordinates (Haversine formula)
 */
function calculateMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export default function TripForm({ onSubmit, loading }) {
    const [form, setForm] = useState({
        name: "",
        currentLat: "",
        currentLng: "",
        pickupLat: "",
        pickupLng: "",
        dropoffLat: "",
        dropoffLng: "",
        start_time: "",
        cycle_hours_used: "",
        total_drive_hours: 11,
        avg_speed_mph: 55
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Compute total miles automatically
        const total_miles = calculateMiles(
            parseFloat(form.pickupLat),
            parseFloat(form.pickupLng),
            parseFloat(form.dropoffLat),
            parseFloat(form.dropoffLng)
        );

        // Prepare payload matching simulate_hos() params
        const payload = {
            total_drive_hours: parseFloat(form.total_drive_hours) || 11,
            total_miles: parseFloat(total_miles.toFixed(2)),
            start_time: form.start_time,
            name: form.name,
            cycle_hours_used: parseFloat(form.cycle_hours_used) || 0,
            pickup_time: 1,
            dropoff_time: 1,
            avg_speed_mph: parseFloat(form.avg_speed_mph) || 55,

            // add coordinates here!
            current: [parseFloat(form.currentLat), parseFloat(form.currentLng)],
            pickup: [parseFloat(form.pickupLat), parseFloat(form.pickupLng)],
            dropoff: [parseFloat(form.dropoffLat), parseFloat(form.dropoffLng)]
        };

        onSubmit(payload);
    };

    return (
        <Card className="shadow-sm p-3 mb-4">
            <Card.Body>
                <h5 className="mb-3">🚛 Plan New Trip</h5>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Trip Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter name (optional)"
                        />
                    </Form.Group>

                    <Row>
                        {[
                            { label: "Current Latitude", name: "currentLat" },
                            { label: "Current Longitude", name: "currentLng" },
                            { label: "Pickup Latitude", name: "pickupLat" },
                            { label: "Pickup Longitude", name: "pickupLng" },
                            { label: "Dropoff Latitude", name: "dropoffLat" },
                            { label: "Dropoff Longitude", name: "dropoffLng" },
                        ].map((f) => (
                            <Form.Group key={f.name} className="mb-2 col-md-6">
                                <Form.Label>{f.label}</Form.Label>
                                <Form.Control
                                    type="number"
                                    name={f.name}
                                    step="any"
                                    value={form[f.name]}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        ))}
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Start Time</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="start_time"
                            value={form.start_time}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Cycle Hours Used</Form.Label>
                        <Form.Control
                            type="number"
                            name="cycle_hours_used"
                            step="0.1"
                            value={form.cycle_hours_used}
                            onChange={handleChange}
                            placeholder="e.g. 12.5"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Total Drive Hours (max 11/day)</Form.Label>
                        <Form.Control
                            type="number"
                            name="total_drive_hours"
                            step="0.1"
                            value={form.total_drive_hours}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Average Speed (mph)</Form.Label>
                        <Form.Control
                            type="number"
                            name="avg_speed_mph"
                            step="0.1"
                            value={form.avg_speed_mph}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="w-100"
                    >
                        {loading ? "Planning..." : "Plan Trip"}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}
