from fastapi.testclient import TestClient


VENDOR_PAYLOAD = {
    "name": "OpenAI",
    "description": "Leading AI research company",
    "vendor_image": "https://example.com/openai.png",
    "url": "https://openai.com",
    "api_url": "https://api.openai.com",
    "note": "Primary vendor",
}


def test_vendor_crud(client: TestClient, admin_headers: dict[str, str]):
    response = client.post("/api/admin/vendors", json=VENDOR_PAYLOAD, headers=admin_headers)
    assert response.status_code == 201
    vendor = response.json()
    vendor_id = vendor["id"]
    assert vendor["name"] == VENDOR_PAYLOAD["name"]

    response = client.get("/api/admin/vendors", headers=admin_headers)
    data = response.json()
    assert data["total"] == 1

    update_payload = {"description": "Updated description"}
    response = client.put(f"/api/admin/vendors/{vendor_id}", json=update_payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"

    response = client.delete(f"/api/admin/vendors/{vendor_id}", headers=admin_headers)
    assert response.status_code == 204

    response = client.get("/api/admin/vendors", headers=admin_headers)
    assert response.json()["total"] == 0


def test_public_vendor_listing(client: TestClient, admin_headers: dict[str, str]):
    client.post("/api/admin/vendors", json=VENDOR_PAYLOAD, headers=admin_headers)
    response = client.get("/api/public/vendors")
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "OpenAI"
