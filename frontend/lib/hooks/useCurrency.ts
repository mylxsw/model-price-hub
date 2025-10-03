"use client";

import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";

import { ApiClient } from "../apiClient";

const CURRENCY_SYMBOL_OVERRIDES: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
  JPY: "¥",
  KRW: "₩",
  INR: "₹",
  AUD: "A$",
  CAD: "C$"
};

interface CurrencyConfigResponse {
  displayCurrency: string;
  exchangeRates: Record<string, number>;
  availableCurrencies: string[];
}

interface CurrencyState {
  selectedCurrency?: string;
  availableCurrencies: string[];
  setSelectedCurrency: (currency: string) => void;
  syncAvailableCurrencies: (currencies: string[], defaultCurrency: string) => void;
}

const useCurrencyStore = create<CurrencyState>((set) => ({
  selectedCurrency: undefined,
  availableCurrencies: [],
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency?.toUpperCase() ?? undefined }),
  syncAvailableCurrencies: (currencies, defaultCurrency) =>
    set((state) => {
      const normalizedDefault = defaultCurrency.toUpperCase();
      const normalizedList = Array.from(
        new Set(
          currencies
            .map((code) => code?.toUpperCase())
            .filter((code): code is string => Boolean(code && code.trim()))
        )
      );
      if (!normalizedList.includes(normalizedDefault)) {
        normalizedList.push(normalizedDefault);
      }
      normalizedList.sort((a, b) => a.localeCompare(b));
      const nextSelected =
        state.selectedCurrency && normalizedList.includes(state.selectedCurrency)
          ? state.selectedCurrency
          : normalizedDefault;
      return {
        availableCurrencies: normalizedList,
        selectedCurrency: nextSelected
      };
    })
}));

const apiClient = new ApiClient();

export function useCurrency() {
  const query = useQuery<CurrencyConfigResponse>({
    queryKey: ["currency-config"],
    queryFn: async () => apiClient.get<CurrencyConfigResponse>("/api/public/currency"),
    staleTime: 10 * 60 * 1000
  });

  const syncAvailableCurrencies = useCurrencyStore((state) => state.syncAvailableCurrencies);
  const setSelectedCurrency = useCurrencyStore((state) => state.setSelectedCurrency);
  const availableCurrencies = useCurrencyStore((state) => state.availableCurrencies);
  const storedSelectedCurrency = useCurrencyStore((state) => state.selectedCurrency);

  const displayCurrency = useMemo(
    () => query.data?.displayCurrency?.toUpperCase() ?? "USD",
    [query.data?.displayCurrency]
  );

  useEffect(() => {
    if (!query.data) return;
    const responseCurrencies =
      query.data.availableCurrencies && query.data.availableCurrencies.length > 0
        ? query.data.availableCurrencies
        : Object.keys(query.data.exchangeRates ?? {});
    syncAvailableCurrencies(responseCurrencies, displayCurrency);
  }, [query.data, displayCurrency, syncAvailableCurrencies]);

  const normalizedRates = useMemo(() => {
    const rates: Record<string, number> = { [displayCurrency]: 1 };
    const responseRates = query.data?.exchangeRates ?? {};
    Object.entries(responseRates).forEach(([code, rate]) => {
      const normalizedCode = code.toUpperCase();
      const numericRate =
        typeof rate === "number" ? rate : typeof rate === "string" ? Number(rate) : NaN;
      if (Number.isFinite(numericRate) && numericRate > 0) {
        rates[normalizedCode] = numericRate;
      }
    });
    return rates;
  }, [query.data?.exchangeRates, displayCurrency]);

  const selectedCurrency = useMemo(() => {
    const stored = storedSelectedCurrency?.toUpperCase();
    if (stored && normalizedRates[stored]) {
      return stored;
    }
    return displayCurrency;
  }, [displayCurrency, normalizedRates, storedSelectedCurrency]);

  const convertCurrency = useCallback(
    (value: number | null | undefined, fromCurrency?: string, toCurrency?: string) => {
      if (value === null || value === undefined) return null;
      if (!Number.isFinite(value)) return null;

      const source = (fromCurrency ?? displayCurrency).toUpperCase();
      const target = (toCurrency ?? selectedCurrency).toUpperCase();

      if (source === target) {
        return { amount: value, currency: target };
      }

      const fromRate = normalizedRates[source];
      const toRate = normalizedRates[target];

      if (!fromRate || !toRate) {
        return { amount: value, currency: source };
      }

      // Convert from source currency to USD first, then to target currency
      // fromRate and toRate are both relative to USD (1 USD = X currency)
      const amountInUsd = value / fromRate;  // Convert source currency to USD
      const finalAmount = amountInUsd * toRate;  // Convert USD to target currency
      return { amount: finalAmount, currency: target };
    },
    [displayCurrency, normalizedRates, selectedCurrency]
  );

  const formatCurrency = useCallback(
    (
      value: number | string | null | undefined,
      fromCurrency?: string,
      options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
    ) => {
      if (value === null || value === undefined) return "";
      const numericValue = typeof value === "string" ? Number(value) : value;
      if (!Number.isFinite(numericValue)) {
        return typeof value === "string" ? value : "";
      }

      const conversion = convertCurrency(numericValue, fromCurrency);
      const amount = conversion?.amount ?? numericValue;
      const currency = conversion?.currency ?? (fromCurrency ?? selectedCurrency);

      const minimumFractionDigits =
        options?.minimumFractionDigits ?? (Math.abs(amount) < 1 ? 4 : 2);
      const maximumFractionDigits =
        options?.maximumFractionDigits ?? (Math.abs(amount) < 1 ? 4 : 2);

      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits,
          maximumFractionDigits
        }).format(amount);
      } catch (error) {
        const fallbackDigits = Math.min(maximumFractionDigits, Math.abs(amount) < 1 ? 4 : 2);
        const symbol = CURRENCY_SYMBOL_OVERRIDES[currency] ?? currency;
        const formatted = amount.toFixed(fallbackDigits);
        const shouldPrefix = symbol.length === 1 || /[$¥€£₩₹]$/.test(symbol);
        return shouldPrefix ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
      }
    },
    [convertCurrency, selectedCurrency]
  );

  return {
    config: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    availableCurrencies,
    selectedCurrency,
    setSelectedCurrency: (currency: string) => setSelectedCurrency(currency),
    convertCurrency,
    formatCurrency,
    displayCurrency,
    exchangeRates: normalizedRates
  };
}
