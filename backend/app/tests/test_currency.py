from app.core.config import get_settings


def test_currency_endpoint_returns_defaults(client):
    response = client.get("/api/public/currency")
    assert response.status_code == 200
    data = response.json()

    assert data["displayCurrency"] == "USD"
    assert "USD" in data["exchangeRates"]
    assert "USD" in data["availableCurrencies"]


def test_currency_endpoint_uses_settings(client):
    settings = get_settings()
    original_display = settings.display_currency
    original_rates = dict(settings.currency_exchange_rates)
    try:
        settings.display_currency = "EUR"
        settings.currency_exchange_rates = {
            "USD": 1.0,
            "EUR": 1.08,
            "JPY": 0.0072,
        }

        response = client.get("/api/public/currency")
        assert response.status_code == 200
        data = response.json()

        assert data["displayCurrency"] == "EUR"
        assert data["exchangeRates"]["EUR"] == settings.currency_exchange_rates["EUR"]
        assert set(data["availableCurrencies"]) == {"USD", "EUR", "JPY"}
    finally:
        settings.display_currency = original_display
        settings.currency_exchange_rates = original_rates
