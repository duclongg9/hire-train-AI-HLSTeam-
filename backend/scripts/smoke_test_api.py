import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def main():
    print("--- STARTING API INTEGRATION SMOKE TEST FOR TRANSCRIBE PRESIGN ---")
    
    # 1. Create a Campaign
    campaign_payload = {
        "title": "Backend Software Engineer",
        "description": "Develop high-performance FastAPI applications.",
        "jd_text": "Requirements: Python, FastAPI, AWS Transcribe, PostgreSQL, Docker.",
        "status": "DRAFT",
        "created_by": str(uuid.uuid4())
    }
    r = requests.post(f"{BASE_URL}/campaigns", json=campaign_payload)
    print(f"1. Create Campaign: HTTP {r.status_code}")
    campaign = r.json()
    campaign_id = campaign["id"]
    print(f"   Campaign ID: {campaign_id}")
    
    # 2. Upsert Rubric (required before publishing)
    rubric_payload = {
        "criteria": [
            {
                "category": "hard_skill",
                "name": "Python & FastAPI",
                "weight": 50,
                "description": "Experience with FastAPI and modern Python features."
            },
            {
                "category": "hard_skill",
                "name": "AWS Integration",
                "weight": 50,
                "description": "Familiarity with AWS SDKs and core services."
            }
        ]
    }
    r = requests.put(f"{BASE_URL}/campaigns/{campaign_id}/rubric", json=rubric_payload)
    print(f"2. Upsert Rubric: HTTP {r.status_code}")
    
    # 3. Publish Campaign
    r = requests.post(f"{BASE_URL}/campaigns/{campaign_id}/publish")
    print(f"3. Publish Campaign: HTTP {r.status_code}")
    
    # 4. Apply Candidate
    candidate_payload = {
        "full_name": "Nguyen Van A",
        "email": f"test-{uuid.uuid4().hex[:6]}@example.com",
        "phone": "0987654321",
        "cv_text": "Experienced Python Engineer with AWS background.",
        "cv_file_name": "cv_nguyen_van_a.pdf"
    }
    r = requests.post(f"{BASE_URL}/public/jobs/{campaign_id}/apply", json=candidate_payload)
    print(f"4. Apply Candidate: HTTP {r.status_code}")
    candidate = r.json()
    candidate_id = candidate["id"]
    print(f"   Candidate ID: {candidate_id}")
    
    # 5. Invite Candidate to Interview to get token
    r = requests.post(f"{BASE_URL}/candidates/{candidate_id}/invite-interview")
    print(f"5. Invite Candidate to Interview: HTTP {r.status_code}")
    invitation = r.json()
    token = invitation["token"]
    print(f"   Interview Token: {token}")
    
    # 6. Test the newly added Transcribe Presign Endpoint
    presign_payload = {
        "language_code": "vi-VN",
        "sample_rate": 16000,
        "media_encoding": "pcm"
    }
    r = requests.post(f"{BASE_URL}/candidate/interview/{token}/transcribe-presign", json=presign_payload)
    print(f"6. Request Transcribe Presigned URL: HTTP {r.status_code}")
    response_data = r.json()
    print(f"   Response payload: {response_data}")
    
    if r.status_code == 200 and "url" in response_data:
        print("\n=== SMOKE TEST PASSED SUCCESSFULLY! ===")
    else:
        print("\n=== SMOKE TEST FAILED! ===")

if __name__ == "__main__":
    main()
