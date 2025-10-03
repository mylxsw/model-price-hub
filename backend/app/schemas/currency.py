from pydantic import BaseModel, Field


class CurrencyConfig(BaseModel):
    display_currency: str = Field(..., alias="displayCurrency")
    exchange_rates: dict[str, float] = Field(..., alias="exchangeRates")
    available_currencies: list[str] = Field(..., alias="availableCurrencies")

    class Config:
        allow_population_by_field_name = True
