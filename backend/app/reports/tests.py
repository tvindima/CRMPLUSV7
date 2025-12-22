import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_leads_summary():
    response = client.get("/reports/leads")
    assert response.status_code == 200
    data = response.json()
    assert "total_leads" in data


def test_properties_summary():
    response = client.get("/reports/properties")
    assert response.status_code == 200
    data = response.json()
    assert "total_properties" in data


def test_agents_summary():
    response = client.get("/reports/agents")
    assert response.status_code == 200
    data = response.json()
    assert "total_agents" in data
