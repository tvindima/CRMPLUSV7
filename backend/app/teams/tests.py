import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_team():
    response = client.post(
        "/teams/",
        json={"name": "Equipe Lisboa"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Equipe Lisboa"
