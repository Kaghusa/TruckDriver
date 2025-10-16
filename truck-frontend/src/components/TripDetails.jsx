import { Card, Table } from "react-bootstrap";

export default function TripDetails({ trip }) {
  if (!trip) return null;

  const { total_hours, total_miles, hos_sim } = trip;

  return (
    <Card className="shadow-sm mt-3">
      <Card.Body>
        <h5 className="mb-3">📄 Trip Summary</h5>
        <p><strong>Total Hours:</strong> {total_hours?.toFixed(2)} hrs</p>
        <p><strong>Total Miles:</strong> {total_miles?.toFixed(2)} mi</p>

        {/* HOS Summary */}
        {hos_sim?.summary && (
          <>
            <h6 className="mt-3">📝 HOS Summary</h6>
            <ul>
              {Object.entries(hos_sim.summary).map(([key, value]) => (
                <li key={key}>
                  <strong>{key.replace(/_/g, " ")}:</strong> {value}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Violations */}
        {hos_sim?.violations?.length > 0 && (
          <>
            <h6 className="mt-3 text-danger">⚠️ Violations</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Time (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {hos_sim.violations.map((v, i) => (
                  <tr key={i}>
                    <td>{v.type}</td>
                    <td>{new Date(v.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {/* Rest Periods */}
        {hos_sim?.rest_periods?.length > 0 && (
          <>
            <h6 className="mt-3 text-info">😴 Rest Periods</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {hos_sim.rest_periods.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.start).toLocaleString()}</td>
                    <td>{new Date(r.end).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {/* Fuel Stops */}
        {hos_sim?.fuel_stops?.length > 0 && (
          <>
            <h6 className="mt-3 text-success">⛽ Fuel Stops</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Mile</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {hos_sim.fuel_stops.map((f, i) => (
                  <tr key={i}>
                    <td>{f.mile}</td>
                    <td>{new Date(f.eta).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
