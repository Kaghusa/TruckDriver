import { useState } from "react";
import { Container, Row, Col, Spinner, Button } from "react-bootstrap";
import TripForm from "../components/TripForm";
import MapView from "../components/MapView";
import TripDetails from "../components/TripDetails";
import { planTrip, downloadReport } from "../api/tripService";

export default function TripPlanner() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (form) => {
    setLoading(true);
    setError("");
    try {
      console.log(form);
      const data = await planTrip({
        current: form.current,
        pickup: form.pickup,
        dropoff: form.dropoff,
        start_time: form.start_time,
        cycle_hours_used: parseFloat(form.cycle_hours_used || 0),
        name: form.name || "",
      });
      setTripData(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setTripData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (tripData) {
      downloadReport(tripData); // implement this in tripService
    }
  };

  const handleGoBack = () => {
    setTripData(null); // reset to show the form again
    setError("");
  };

  return (
    <Container fluid className="mt-5">
      <Row className="justify-content-center">
        {!tripData && (
          <Col md={6}>
            <h3 className="mb-4 text-center">🚛 Plan a New Trip</h3>
            <TripForm onSubmit={handleSubmit} loading={loading} />
            {error && <p className="text-danger mt-2">{error}</p>}
          </Col>
        )}

        {loading && (
          <Col md={12} className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </Col>
        )}

        {tripData && (
          <>
            <Col md={12} className="d-flex justify-content-between align-items-center mb-3">
              <h3>📍 Trip Overview: {tripData.trip.name || "Unnamed Trip"}</h3>
              <Button variant="secondary" onClick={handleGoBack}>
                ← Go Back
              </Button>
            </Col>

            <Col md={12}>
              <MapView
                route={tripData.route}
                trip={tripData.trip}
                hos={{
                  // Fuel stops from hos_sim summary
                  fuel_stops: tripData.hos_sim?.fuel_stops || [],
                  // Rest periods (OFF_DUTY) collected from all days
                  rest_periods: tripData.hos_sim?.days?.flatMap(day =>
                    day.events?.filter(e => e.type === "OFF_DUTY") || []
                  ) || [],
                  // Violations collected from all days and route
                  violations: tripData.hos_sim?.violations || []
                }}
              />
            </Col>

            <Col md={12} className="mt-3">
              <TripDetails trip={tripData} />
            </Col>

            <Col md={12} className="mt-3 d-flex justify-content-end">
              <Button variant="success" onClick={handleDownload}>
                Download Report
              </Button>
            </Col>
          </>
        )}
      </Row>
    </Container>
  );
}
