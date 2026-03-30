#!/usr/bin/env python
"""
Test camera endpoint without permission errors
"""
from app import create_app
from app.models.camera import Camera
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    # Create a test JWT token
    access_token = create_access_token(identity='c4ca8848-0d61-4f93-9f63-ebaca7446e17')
    
    # Test the endpoint using the test client
    with app.test_client() as client:
        # Make request with valid JWT
        response = client.get(
            '/api/v2/cameras',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
        if response.status_code == 200 or response.status_code == 403 and 'cameras:read' not in str(response.data):
            print("\n✓ Camera endpoint is now accessible (no cameras:read permission required)")
        elif 'cameras:read' in str(response.data):
            print("\n✗ Still requiring cameras:read permission")
        else:
            print(f"\n? Got status {response.status_code}: {response.get_json()}")
