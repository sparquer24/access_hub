#!/usr/bin/env python
"""Test PUT location endpoint"""

import sys
sys.path.insert(0, '.')

from app import create_app
from app.models import Location

app = create_app()

with app.app_context():
    # Get the real location
    location = Location.query.filter_by(name='Tower A Entry').first()
    
    if location:
        print(f"Location ID: {location.id}")
        print(f"Location Name: {location.name}")
        print(f"Current Building: {location.building}")
        print(f"Current Floor: {location.floor}")
        print(f"Current Location Type: {location.location_type}")
        print(f"Organization ID: {location.organization_id}")
        print()
        print("For PUT test, you should:")
        print(f"1. Use URL: /locations/{location.id}")
        print("2. Only include fields you want to CHANGE in the body")
        print("3. If keeping the same name, don't include 'name' in body")
        print()
        print("Example: Change building to 'Tower B' only:")
        print("""
{
  "building": "Tower B"
}
        """)
    else:
        print("Location 'Tower A Entry' not found")
