import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_lead():
    response = client.post(
        "/leads/",
        json={
            "name": "João Silva",
            "email": "joao.silva@example.com",
            "phone": "912345678",
            "origin": "website",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "João Silva"
    assert data["status"] == "new"
