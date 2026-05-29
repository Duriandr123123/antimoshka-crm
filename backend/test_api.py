import pytest
from fastapi.testclient import TestClient

from app import app
from seed import seed


@pytest.fixture(scope="module")
def client():
    seed()
    return TestClient(app)


def test_seed_data_and_login(client: TestClient):
    login = client.post("/api/login", json={"username": "admin", "password": "admin123"})
    assert login.status_code == 200
    assert login.json()["role"] == "admin"

    clients = client.get("/api/clients")
    deals = client.get("/api/deals")
    assert clients.status_code == 200
    assert deals.status_code == 200
    assert len(clients.json()) >= 10
    assert len(deals.json()) >= 10


def test_create_client_deal_change_status_and_dashboard(client: TestClient):
    created_client = client.post(
        "/api/clients",
        json={
            "name": "Pytest Client",
            "phone": "+7 700 111 22 33",
            "address": "Test address",
            "source": "Другое",
            "comment": "Created by pytest",
        },
    )
    assert created_client.status_code == 200
    client_id = created_client.json()["id"]

    created_deal = client.post(
        "/api/deals",
        json={
            "client_id": client_id,
            "net_type": "Обычная",
            "windows_count": 2,
            "amount": 44000,
            "status": "Новая заявка",
            "comment": "Created by pytest",
        },
    )
    assert created_deal.status_code == 200
    deal_id = created_deal.json()["id"]

    updated = client.patch(
        f"/api/deals/{deal_id}/status",
        json={"status": "Связались", "comment": "Kanban status change"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Связались"

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data["total_leads"] >= 11
    assert data["active_deals"] >= 1
    assert "conversion" in data


def test_client_card_contains_history(client: TestClient):
    clients = client.get("/api/clients").json()
    card = client.get(f"/api/clients/{clients[0]['id']}/card")
    assert card.status_code == 200
    data = card.json()
    assert "client" in data
    assert "deals" in data
    assert "history" in data
