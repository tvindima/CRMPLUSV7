import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime

client = TestClient(app)


def test_create_match():
    response = client.post(
        "/match-plus/",
        json={
            "lead_id": 1,
            "property_id": 1,
            "score": 0.85,
            "created_at": datetime.now().isoformat(),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["score"] == 0.85
