from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    response = client.post("/api/admin/auth/login", json={"username": "admin", "password": "adminpass"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert "access_token" in payload


def test_login_failure(client: TestClient):
    response = client.post("/api/admin/auth/login", json={"username": "admin", "password": "wrong"})
    assert response.status_code == 401


def test_logout_noop(client: TestClient, admin_headers: dict[str, str]):
    response = client.post("/api/admin/auth/logout", headers=admin_headers)
    assert response.status_code == 204
