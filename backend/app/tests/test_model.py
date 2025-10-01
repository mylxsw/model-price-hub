import json

from fastapi.testclient import TestClient

from .test_vendor import VENDOR_PAYLOAD

MODEL_PAYLOAD = {
    "vendor_id": 1,
    "model": "gpt-4",
    "vendor_model_id": "gpt-4-2024",
    "description": "Advanced GPT model",
    "model_image": "https://example.com/gpt4.png",
    "max_context_tokens": 8192,
    "max_output_tokens": 2048,
    "model_capability": ["chat", "code"],
    "model_url": "https://openai.com/gpt4",
    "price_model": "token",
    "price_currency": "USD",
    "price_data": {"base": {"input_token_1m": 30.0, "output_token_1m": 60.0}},
    "note": "Flagship model",
    "license": ["commercial"],
    "status": "enabled",
}


def create_vendor(client: TestClient, admin_headers: dict[str, str]) -> int:
    response = client.post("/api/admin/vendors", json=VENDOR_PAYLOAD, headers=admin_headers)
    return response.json()["id"]


def test_model_crud_and_public_access(client: TestClient, admin_headers: dict[str, str]):
    vendor_id = create_vendor(client, admin_headers)
    payload = MODEL_PAYLOAD.copy()
    payload["vendor_id"] = vendor_id

    response = client.post("/api/admin/models", json=payload, headers=admin_headers)
    assert response.status_code == 201
    model = response.json()
    model_id = model["id"]
    assert model["model"] == "gpt-4"
    assert model["vendor"]["id"] == vendor_id
    assert model["price_data"]["base"]["input_token_1m"] == 30.0

    response = client.put(
        f"/api/admin/models/{model_id}",
        json={"max_context_tokens": 16000, "model_capability": ["chat", "analysis"]},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["max_context_tokens"] == 16000
    assert "analysis" in response.json()["model_capability"]

    response = client.get("/api/public/models", params={"search": "gpt"})
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["vendor"]["name"] == VENDOR_PAYLOAD["name"]

    response = client.get(f"/api/public/models/{model_id}")
    detail = response.json()
    assert detail["model"] == "gpt-4"
    assert detail["price_data"]["base"]["output_token_1m"] == 60.0

    response = client.delete(f"/api/admin/models/{model_id}", headers=admin_headers)
    assert response.status_code == 204

    response = client.get("/api/public/models")
    assert response.json()["total"] == 0
