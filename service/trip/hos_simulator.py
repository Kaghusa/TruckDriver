from datetime import datetime, timedelta

# Constants based on simplified FMCSA rules
DRIVE_LIMIT = 11.0           # Max driving hours per day
BREAK_AFTER = 8.0            # Mandatory break after X hours driving
BREAK_DURATION = 0.5         # Break duration in hours
MIN_OFF_FOR_14_RESET = 10.0  # Off-duty hours
CYCLE_LIMIT = 70.0           # Max hours per 8-day cycle
ON_DUTY_WINDOW = 14.0        # Max on-duty per day
AVG_SPEED_MPH = 55.0         # Average speed for distance -> hours

def place_fuel_stops_along_route(total_miles, start_time, average_speed_mph=55.0):
    """Return list of fuel stops every 1000 miles"""
    stops = []
    miles = 1000
    while miles < total_miles:
        eta_hours = miles / average_speed_mph
        eta = start_time + timedelta(hours=eta_hours)
        stops.append({"mile": miles, "eta": eta.isoformat()})
        miles += 1000
    return stops

def simulate_hos(
    total_drive_hours,
    total_miles,
    start_time: datetime,
    cycle_used: float,
    pickup_time=1.0,
    dropoff_time=1.0,
    avg_speed_mph=AVG_SPEED_MPH,
    enable_sleeper_split=True
):
    """
    Simulates Hours of Service schedule per FMCSA rules.

    Returns a dictionary:
      days: daily events with fuel stops and violations
      violations: overall violations (type + timestamp)
      fuel_stops: all fuel stops with ETA
      summary: total hours, miles, remaining, days simulated
    """
    remaining_drive = float(total_drive_hours)
    current = start_time
    used_cycle = float(cycle_used)
    days = []
    overall_violations = []

    fuel_stops = place_fuel_stops_along_route(total_miles, start_time, average_speed_mph=avg_speed_mph)
    next_fuel_index = 0
    miles_covered = 0.0
    day_count = 0
    max_days = 60  # safeguard

    def append_event(ev_list, ev_type, dur_hours, start_dt, note=None):
        end_dt = start_dt + timedelta(hours=dur_hours)
        ev = {
            "type": ev_type,
            "duration": round(dur_hours, 2),
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat()
        }
        if note:
            ev["note"] = note
        ev_list.append(ev)
        return end_dt

    while remaining_drive > 1e-6 and day_count < max_days:
        day_count += 1
        day_events = []
        day_violations = []
        day_fuel_stops = []
        on_duty_remaining = ON_DUTY_WINDOW
        drive_today = 0.0
        since_last_break = 0.0

        # Pickup time at start of trip
        if (current - start_time).total_seconds() < 1 and pickup_time > 0:
            current = append_event(day_events, "ON_DUTY_NOT_DRIVE", pickup_time, current, note="pickup")
            on_duty_remaining -= pickup_time
            used_cycle += pickup_time

        # Driving loop for the day
        while drive_today < DRIVE_LIMIT and on_duty_remaining > 1e-6 and remaining_drive > 1e-6:
            # Mandatory break
            if since_last_break >= BREAK_AFTER:
                current = append_event(day_events, "BREAK", BREAK_DURATION, current, note="mandatory_break")
                on_duty_remaining -= BREAK_DURATION
                since_last_break = 0.0
                continue

            allowed = min(DRIVE_LIMIT - drive_today, on_duty_remaining, remaining_drive)
            if allowed <= 0:
                break

            # DRIVE event
            evt_start = current
            current = append_event(day_events, "DRIVE", allowed, evt_start)
            drive_today += allowed
            remaining_drive -= allowed
            on_duty_remaining -= allowed
            since_last_break += allowed
            used_cycle += allowed

            # Track miles and fuel stops
            miles_slice = allowed * avg_speed_mph
            miles_covered += miles_slice

            while next_fuel_index < len(fuel_stops) and miles_covered >= fuel_stops[next_fuel_index]["mile"]:
                fs = fuel_stops[next_fuel_index]
                current = append_event(day_events, "FUEL_STOP", 0.5, current, note=f"fuel_at_{fs['mile']}mi")
                day_fuel_stops.append(fs)
                used_cycle += 0.5
                on_duty_remaining -= 0.5
                next_fuel_index += 1

            # Check cycle limit
            if used_cycle > CYCLE_LIMIT:
                day_violations.append({"type": "CYCLE_LIMIT_EXCEEDED", "time": current.isoformat()})
                overall_violations.append({"type": "CYCLE_LIMIT_EXCEEDED", "time": current.isoformat()})

        # Dropoff time at end
        if remaining_drive <= 1e-6 and dropoff_time > 0:
            current = append_event(day_events, "ON_DUTY_NOT_DRIVE", dropoff_time, current, note="dropoff")
            used_cycle += dropoff_time
            on_duty_remaining -= dropoff_time

        # Mandatory off-duty
        current = append_event(day_events, "OFF_DUTY", MIN_OFF_FOR_14_RESET, current)

        # Compute daily summary
        total_drive_day = sum(ev["duration"] for ev in day_events if ev["type"] == "DRIVE")
        total_rest_day = sum(ev["duration"] for ev in day_events if ev["type"] in ["OFF_DUTY", "BREAK"])
        total_on_duty_day = sum(ev["duration"] for ev in day_events if ev["type"].startswith("ON_DUTY"))

        # Append daily data
        day_label = day_events[0]["start"][:10] if day_events else current.date().isoformat()
        days.append({
            "date": day_label,
            "events": day_events,
            "violations": day_violations,
            "fuel_stops": day_fuel_stops,
            "summary": {
                "drive": round(total_drive_day, 2),
                "rest": round(total_rest_day, 2),
                "on_duty": round(total_on_duty_day, 2)
            }
        })

    # Check if route is incomplete
    if remaining_drive > 1e-6:
        overall_violations.append({"type": "INCOMPLETE_ROUTE", "time": current.isoformat()})

    return {
        "days": days,
        "violations": overall_violations,
        "fuel_stops": fuel_stops,
        "summary": {
            "total_drive_hours": round(total_drive_hours, 2),
            "total_miles": round(total_miles, 2),
            "cycle_hours_used": round(used_cycle, 2),
            "remaining_drive_hours": round(max(0.0, remaining_drive), 2),
            "days_simulated": len(days)
        }
    }
