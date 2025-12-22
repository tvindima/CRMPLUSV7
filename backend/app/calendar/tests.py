import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_event():
    response = client.post(
        "/calendar/",
        json={
            "title": "Reunião comercial",
            "description": "Reunião com potencial cliente.",
            "start_time": "2025-12-12T10:00:00",
            "end_time": "2025-12-12T11:00:00",
            "agent_id": 1,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Reunião comercial"
