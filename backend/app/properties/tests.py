import os
import shutil
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine

client = TestClient(app)


def _payload(ref: str = "REF-1"):
    return {
        "reference": ref,
        "title": f"Titulo {ref}",
        "business_type": "Venda",
        "property_type": "Apartamento",
        "typology": "T2",
        "description": "Desc",
        "observations": "Obs",
        "price": 123000.0,
        "usable_area": 80.5,
        "land_area": 0.0,
        "municipality": "Leiria",
        "parish": "Leiria",
        "status": "available",
    }


@pytest.fixture(autouse=True)
def reset_db(tmp_path):
    # schema clean for each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    media_dir = os.path.join("media", "properties")
    if os.path.exists(media_dir):
        shutil.rmtree(media_dir)
    yield
    Base.metadata.drop_all(bind=engine)


def test_list_empty():
    resp = client.get("/properties/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_property_success():
    resp = client.post("/properties/", json=_payload("REF-100"))
    assert resp.status_code == 201
    data = resp.json()
    assert data["reference"] == "REF-100"
    assert data["price"] == 123000.0
    assert data["status"] == "available"


def test_create_property_missing_required():
    resp = client.post("/properties/", json={"reference": "REF-200"})
    assert resp.status_code == 422  # missing required fields


def test_get_and_update_property():
    created = client.post("/properties/", json=_payload("REF-300")).json()
    prop_id = created["id"]

    get_resp = client.get(f"/properties/{prop_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["reference"] == "REF-300"

    update_resp = client.put(f"/properties/{prop_id}", json={"price": 99999.5, "status": "reserved"})
    assert update_resp.status_code == 200
    assert update_resp.json()["price"] == 99999.5
    assert update_resp.json()["status"] == "reserved"


def test_delete_property_and_404_after():
    created = client.post("/properties/", json=_payload("REF-400")).json()
    prop_id = created["id"]

    del_resp = client.delete(f"/properties/{prop_id}")
    assert del_resp.status_code == 200

    get_resp = client.get(f"/properties/{prop_id}")
    assert get_resp.status_code == 404


def test_delete_property_not_found():
    resp = client.delete("/properties/999999")
    assert resp.status_code == 404


def test_upload_images():
    created = client.post("/properties/", json=_payload("REF-500")).json()
    prop_id = created["id"]

    # autenticar staff para upload protegido
    login = client.post(
        "/auth/login",
        json={"email": "tvindima@imoveismais.pt", "password": "testepassword123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    files = [("files", ("foto1.jpg", b"fake-bytes", "image/jpeg"))]
    upload_resp = client.post(
        f"/properties/{prop_id}/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert upload_resp.status_code == 200
    data = upload_resp.json()
    assert data["uploaded"] == 1
    assert len(data["urls"]) == 1
    assert data["urls"][0].endswith("foto1.jpg")

    # property should include the image afterwards
    get_resp = client.get(f"/properties/{prop_id}")
    assert get_resp.status_code == 200
    assert len(get_resp.json().get("images", [])) == 1
