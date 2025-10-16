from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripSerializer
from .models import Trip
from .hos_simulator import simulate_hos
import requests
import os
from datetime import datetime

# Load ORS API key safely
ORS_KEY = os.environ.get('ORS_API_KEY')

def is_valid_coord(coord):
    """Check if coordinate is a [lat, lng] pair within valid ranges."""
    try:
        lat, lng = float(coord[0]), float(coord[1])
        return -90 <= lat <= 90 and -180 <= lng <= 180
    except (TypeError, ValueError, IndexError):
        return False

def get_route_from_ors(coords):
    """
    Given a list of coordinates [[lat, lng], ...],
    call OpenRouteService and return (route_geojson, total_hours, total_miles)
    """
    if not ORS_KEY:
        raise RuntimeError("ORS_API_KEY not set in environment variables")

    coords_str = [[c[1], c[0]] for c in coords]  # ORS expects [lng, lat]
    url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson'
    headers = {
        'Authorization': ORS_KEY,
        'Content-Type': 'application/json'
    }
    body = {'coordinates': coords_str}

    r = requests.post(url, json=body, headers=headers)
    r.raise_for_status()
    data = r.json()

    if 'features' not in data or not data['features']:
        raise ValueError("Invalid ORS response structure")

    route_geojson = data['features'][0]
    summary = route_geojson['properties']['summary']
    total_hours = summary['duration'] / 3600.0
    total_miles = summary['distance'] * 0.000621371  # meters -> miles

    return route_geojson, total_hours, total_miles


class PlanRouteView(APIView):
    """
    POST endpoint to plan a trip, compute route, and simulate HOS.
    """

    def post(self, request):
        data = request.data

        # Extract and validate input fields
        current = data.get('current')        # [lat, lng]
        pickup = data.get('pickup')          # [lat, lng]
        dropoff = data.get('dropoff')        # [lat, lng]
        start_time_str = data.get('start_time')
        cycle_hours_used = float(data.get('cycle_hours_used', 0.0))
        trip_name = data.get('name', '')

        if not all([current, pickup, dropoff, start_time_str]):
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not all(map(is_valid_coord, [current, pickup, dropoff])):
            return Response(
                {"error": "Invalid coordinates"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_time = datetime.fromisoformat(start_time_str)
        except ValueError:
            return Response(
                {"error": "start_time must be ISO format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch route from OpenRouteService
        try:
            route_geojson, total_hours, total_miles = get_route_from_ors(
                [current, pickup, dropoff]
            )
        except Exception as e:
            return Response(
                {"error": "Routing failed", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Simulate Hours of Service (HOS)
        hos_sim = simulate_hos(
            total_drive_hours=total_hours,
            total_miles=total_miles,
            start_time=start_time,
            cycle_used=cycle_hours_used
        )

        # Save trip
        trip = Trip.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=trip_name,
            start_time=start_time,
            current_lat=current[0],
            current_lng=current[1],
            pickup_lat=pickup[0],
            pickup_lng=pickup[1],
            dropoff_lat=dropoff[0],
            dropoff_lng=dropoff[1],
            cycle_hours_used=cycle_hours_used
        )

        serializer = TripSerializer(trip)

        return Response({
            'trip': serializer.data,
            'route': route_geojson,
            'total_hours': total_hours,
            'total_miles': total_miles,
            'hos_sim': hos_sim
        })
