import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons
const icons = {
    current: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    }),
    pickup: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    }),
    dropoff: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    }),
    fuel: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    }),
    rest: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/3099/3099980.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    }),
    violation: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    }),
};

// Helper: get lat/lng along route by mile
const getLatLngAlongRoute = (coords, totalMiles, mile) => {
    if (!coords.length) return null;
    const percent = Math.min(mile / totalMiles, 1);
    const index = Math.floor(percent * (coords.length - 1));
    return coords[index];
};

export default function MapView({ route, trip, hos }) {
    if (!trip || !route) return null;

    const current = [trip.current_lat, trip.current_lng];
    const pickup = [trip.pickup_lat, trip.pickup_lng];
    const dropoff = [trip.dropoff_lat, trip.dropoff_lng];

    const coords = route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
    const totalRouteMiles = (route.properties?.summary?.distance || 1) / 1609.34;

    // Fuel stop markers
    const fuelMarkers = (hos?.fuel_stops || [])
        .map(f => {
            const pos = getLatLngAlongRoute(coords, totalRouteMiles, f.mile);
            if (!pos) return null;
            return { lat: pos[0], lng: pos[1], ...f };
        })
        .filter(Boolean);

    // Rest period markers: distribute evenly along the route if mile not provided
    const restCount = (hos?.rest_periods || []).length;
    const restMarkers = (hos?.rest_periods || []).map((r, i) => {
        // Use provided mile if exists, otherwise spread evenly along route
        const mile = r.mile ?? (totalRouteMiles * (i + 1) / (restCount + 1));
        const pos = getLatLngAlongRoute(coords, totalRouteMiles, mile);
        if (!pos) return null;
        return { lat: pos[0], lng: pos[1], ...r };
    }).filter(Boolean);

    // Violation markers
    const violationCount = (hos?.violations || []).length;
    console.log(hos?.violations)
    const violationMarkers = (hos?.violations || [])
        .map((v, i) => {
            // Calculate mile along route proportionally if v.mile is missing
            const mile = v.mile ?? (totalRouteMiles * (i + 1) / (violationCount + 1));
            const pos = getLatLngAlongRoute(coords, totalRouteMiles, mile);
            if (!pos) return null;
            return { lat: pos[0], lng: pos[1], ...v };
        })
        .filter(Boolean);

    return (
        <MapContainer center={current} zoom={6} style={{ height: "500px", width: "100%", borderRadius: "12px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Current, Pickup, Dropoff */}
            <Marker position={current} icon={icons.current}>
                <Popup>
                    <strong>Current Location</strong><br />{current.join(", ")}
                </Popup>
            </Marker>
            <Marker position={pickup} icon={icons.pickup}>
                <Popup>
                    <strong>Pickup Location</strong><br />{pickup.join(", ")}
                </Popup>
            </Marker>
            <Marker position={dropoff} icon={icons.dropoff}>
                <Popup>
                    <strong>Dropoff Location</strong><br />{dropoff.join(", ")}
                </Popup>
            </Marker>

            {/* Fuel stops */}
            {fuelMarkers.map((f, i) => (
                <Marker key={`fuel-${i}`} position={[f.lat, f.lng]} icon={icons.fuel}>
                    <Popup>
                        <strong>Fuel Stop #{i + 1}</strong><br />
                        Mile: {f.mile}<br />
                        ETA: {f.eta}
                    </Popup>
                </Marker>
            ))}

            {/* Rest periods */}
            {restMarkers.map((r, i) => (
                <Marker key={`rest-${i}`} position={[r.lat, r.lng]} icon={icons.rest}>
                    <Popup>
                        <strong>Rest Period #{i + 1}</strong><br />
                        Start: {r.start}<br />
                        End: {r.end}
                    </Popup>
                </Marker>
            ))}

            {/* Violations */}
            {violationMarkers.map((v, i) => (
                <Marker key={`violation-${i}`} position={[v.lat, v.lng]} icon={icons.violation}>
                    <Popup>
                        <strong>Violation #{i + 1}</strong><br />
                        {v.type || "Unknown"}<br />
                        {v.note || ""}
                    </Popup>
                </Marker>
            ))}

            {/* Route polyline */}
            {coords.length > 0 && (
                <Polyline positions={coords} color="blue" weight={4} opacity={0.7} />
            )}
        </MapContainer>
    );
}
