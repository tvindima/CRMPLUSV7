import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_agent():
    response = client.post(
        "/agents/",
        json={
            "name": "Maria Faria",
            "email": "maria.faria@example.com",
            "phone": "913456789",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Maria Faria"
    assert data["email"] == "maria.faria@example.com"
