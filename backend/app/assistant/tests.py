import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_intent_parse():
    response = client.post("/assistant/intent/", json={"text": "Quero adicionar lead"})
    assert response.status_code == 200
    data = response.json()
    assert "create_lead" in data["result"]
