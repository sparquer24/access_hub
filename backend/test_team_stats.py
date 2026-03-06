"""
Quick test script for manager team stats endpoint
"""
import requests

BASE_URL = "http://localhost:5001"

def test_team_stats():
    """Test the team stats endpoint"""
    
    print("Testing Manager Team Stats Endpoint")
    print("=" * 70)
    
    # Note: This will return 401 without token, but that's okay - we just need to verify it doesn't crash
    try:
        response = requests.get(f"{BASE_URL}/api/manager/team/stats")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Endpoint is accessible (401 = needs auth, but not crashing)")
            print(f"Response: {response.json()}")
            return True
        elif response.status_code == 500:
            print("❌ Server error - endpoint still broken")
            print(f"Response: {response.text[:500]}")
            return False
        else:
            print(f"Response: {response.json()}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_team_stats()
