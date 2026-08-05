import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.database import get_db

client = TestClient(app)

def test_api():
    print("Starting API compile and runtime testing...")
    
    # Test 1: Get root or hello message
    response = client.get("/")
    print(f"GET / response status: {response.status_code}")
    assert response.status_code == 200
    
    # Test 2: Demo Login
    response = client.post("/api/auth/demo-login")
    print(f"POST /api/auth/demo-login status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]
    print("Demo Login verified. Token generated.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Dashboard Stats
    response = client.get("/api/patient/dashboard", headers=headers)
    print(f"GET /api/patient/dashboard status: {response.status_code}")
    assert response.status_code == 200
    dash_data = response.json()
    assert "recovery_score" in dash_data
    assert "today_medications" in dash_data
    print(f"Dashboard Stats verified. Recovery Score: {dash_data['recovery_score']}")
    
    # Test 4: Chat (General Assistant fallback or simple check)
    chat_payload = {"message": "Hello, how is my recovery going?"}
    response = client.post("/api/patient/chat", headers=headers, json=chat_payload)
    print(f"POST /api/patient/chat status: {response.status_code}")
    assert response.status_code == 200
    chat_data = response.json()
    assert "message" in chat_data
    print(f"Chat flow verified. Agent: {chat_data['sender']}, Response length: {len(chat_data['message'])}")
    
    print("\nBackend self-verification COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"Verification FAILED: {e}", file=sys.stderr)
        sys.exit(1)
