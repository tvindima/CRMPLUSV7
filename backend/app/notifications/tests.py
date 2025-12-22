import pytest
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime

client = TestClient(app)


def test_create_notification():
    response = client.post(
        "/notifications/",
        json={
            "message": "Nova mensagem para agente.",
            "recipient_id": 1,
            "delivered": False,
            "created_at": datetime.now().isoformat(),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Nova mensagem para agente."
