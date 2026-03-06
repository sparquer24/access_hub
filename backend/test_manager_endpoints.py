"""
Test script to check leave approval/rejection endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_endpoints():
    """Test the leave approval endpoints"""
    
    # Test data
    leave_id = 1  # Replace with actual leave ID
    
    endpoints = [
        {
            'name': 'Approve Leave',
            'url': f'{BASE_URL}/api/manager/leaves/{leave_id}/approve',
            'method': 'POST',
            'body': {'comments': 'Approved for testing'}
        },
        {
            'name': 'Reject Leave',
            'url': f'{BASE_URL}/api/manager/leaves/{leave_id}/reject',
            'method': 'POST',
            'body': {'comments': 'Rejected for testing'}
        },
        {
            'name': 'Get Pending Leaves',
            'url': f'{BASE_URL}/api/manager/leaves/pending',
            'method': 'GET',
            'body': None
        },
        {
            'name': 'Get Team Members',
            'url': f'{BASE_URL}/api/manager/team/members',
            'method': 'GET',
            'body': None
        },
        {
            'name': 'Team Performance Report',
            'url': f'{BASE_URL}/api/manager/reports/team-performance',
            'method': 'GET',
            'body': None
        }
    ]
    
    print("Testing Manager API Endpoints")
    print("=" * 70)
    
    for endpoint in endpoints:
        print(f"\n{endpoint['name']}")
        print(f"URL: {endpoint['url']}")
        print(f"Method: {endpoint['method']}")
        
        try:
            headers = {'Content-Type': 'application/json'}
            # Note: Add Authorization header here when testing with real token
            # headers['Authorization'] = 'Bearer YOUR_TOKEN'
            
            if endpoint['method'] == 'POST':
                response = requests.post(
                    endpoint['url'], 
                    json=endpoint['body'],
                    headers=headers
                )
            else:
                response = requests.get(endpoint['url'], headers=headers)
            
            print(f"Status: {response.status_code}")
            
            # Show response
            try:
                print(f"Response: {json.dumps(response.json(), indent=2)[:200]}")
            except:
                print(f"Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"Error: {e}")
        
        print("-" * 70)

if __name__ == "__main__":
    test_endpoints()
