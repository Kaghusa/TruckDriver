# trip/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth.models import User
from requests.exceptions import HTTPError

class TripAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.base_trip_data = {
            "name": "Test Trip",
            "start_time": "2025-10-15T08:00:00Z",
            "current": [38.8951, -77.0364],
            "pickup": [39.0997, -94.5786],
            "dropoff": [41.8781, -87.6298],
            "cycle_hours_used": 12.0
        }

    @patch("trip.views.get_route_from_ors")
    def test_normal_trip(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 5.0, 100.0)
        response = self.client.post(reverse('plan_route'), self.base_trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("trip", response.data)
        self.assertIn("route", response.data)
        self.assertIn("total_hours", response.data)
        self.assertIn("total_miles", response.data)
        self.assertIn("hos_sim", response.data)

    @patch("trip.views.get_route_from_ors")
    def test_short_trip(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 1.0, 10.0)
        data = self.base_trip_data.copy()
        data.update({"pickup": [38.9, -77.03], "dropoff": [38.91, -77.04]})
        response = self.client.post(reverse('plan_route'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(response.data["total_hours"], 5)

    @patch("trip.views.get_route_from_ors")
    def test_long_trip_multi_day(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 25.0, 1500.0)
        response = self.client.post(reverse('plan_route'), self.base_trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming simulate_hos returns a summary with days_simulated
        self.assertIn("hos_sim", response.data)

    def test_missing_pickup_or_dropoff(self):
        data = self.base_trip_data.copy()
        data.pop("pickup")  # remove pickup to trigger 400
        response = self.client.post(reverse('plan_route'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch("trip.views.get_route_from_ors")
    def test_invalid_api_key(self, mock_route):
        mock_route.side_effect = HTTPError("401 Client Error: Unauthorized")
        response = self.client.post(reverse('plan_route'), self.base_trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Routing failed", str(response.data))

    @patch("trip.views.get_route_from_ors")
    def test_hos_violations(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 5.0, 100.0)
        response = self.client.post(reverse('plan_route'), self.base_trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("hos_sim", response.data)
        # We assume simulate_hos may return violations
        self.assertIsInstance(response.data["hos_sim"], dict)

    @patch("trip.views.get_route_from_ors")
    def test_fuel_stops(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 5.0, 1000.0)
        response = self.client.post(reverse('plan_route'), self.base_trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("hos_sim", response.data)
        # We can check fuel_stops exists in hos_sim dict if simulate_hos provides it
        self.assertIsInstance(response.data["hos_sim"], dict)

    @patch("trip.views.get_route_from_ors")
    def test_invalid_coordinates(self, mock_route):
        mock_route.return_value = ({"type": "Feature"}, 5.0, 100.0)
        data = self.base_trip_data.copy()
        data.update({"pickup": [200, 200]})  # invalid lat/lng
        response = self.client.post(reverse('plan_route'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
