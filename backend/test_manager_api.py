import requests

url = "http://202.53.72.149:5001/api/v2/auth/login"
payload = {
    "username": "superadmin@accesshub.com",
    "password": "SuperAdmin@123"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    print("✅ Login Successful!")
    print(response.json())
else:
    print(f"❌ Login Failed (Status Code: {response.status_code})")
    print(response.json())
