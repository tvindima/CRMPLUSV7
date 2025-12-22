import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime

client = TestClient(app)


def test_create_feed_item():
    response = client.post(
        "/feed/",
        json={
            "type": "new_lead",
            "message": "Novo lead criado.",
            "created_at": datetime.now().isoformat(),
            "user_id": 1,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "new_lead"
