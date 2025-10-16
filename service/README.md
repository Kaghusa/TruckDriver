# HOS Route Planner & Simulator

This is a **Full-stack Django + React** app that simulates FMCSA Hours-of-Service (HOS) rules for property-carrying drivers, plans routes, places fuel stops every 1,000 miles, and generates daily log sheets.

## Features

- Input: Current location, Pickup, Dropoff, Start time, Cycle hours used
- Output:
  - Map with route and stops (pickup, dropoff, fuel stops)
  - Daily HOS log sheets showing drive/on-duty/off-duty events
  - Handles sleeper berth splits and FMCSA rules (11/14 hr limits, 70 hr/8-day cycles)
- Fuel stops automatically placed every ~1,000 miles
- Tracks 30-min driving breaks and off-duty requirements
- Stores trip records in database (Django model `Trip`)

## Tech Stack

- **Backend:** Django 4.x, Django REST Framework
- **Frontend:** React.js (can be deployed on Vercel)
- **Routing:** OpenRouteService API
- **Deployment:** Supports Vercel / Heroku / any WSGI server
- **Database:** SQLite (default), optionally PostgreSQL

## Setup Instructions

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd hos_project
