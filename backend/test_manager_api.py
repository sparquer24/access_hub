"""
Test script to check the manager team members API endpoint
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5001"
API_URL = f"{BASE_URL}/api/manager/team/members"

def test_api_with_token():
    """Test the API with authentication token"""
    # You need to provide a valid JWT token
    # For now, let's just make the request to see the error
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Optionally add Authorization header if you have a token
    # headers["Authorization"] = "Bearer YOUR_TOKEN_HERE"
    
    print(f"Testing endpoint: {API_URL}")
    print("=" * 50)
    
    try:
        response = requests.get(API_URL, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
    except Exception as e:
        print(f"Error making request: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_with_token()
