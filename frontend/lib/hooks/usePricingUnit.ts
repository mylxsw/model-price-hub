"use client";

import { create } from "zustand";

export type PricingUnit = "1K" | "1M";

const TOKENS_PER_KILO = 1024;
const TOKENS_PER_MEGA = TOKENS_PER_KILO * 1024;
const KILOS_PER_MEGA = TOKENS_PER_MEGA / TOKENS_PER_KILO;

interface PricingUnitState {
  selectedUnit: PricingUnit;
  setSelectedUnit: (unit: PricingUnit) => void;
}

const usePricingUnitStore = create<PricingUnitState>((set) => ({
  selectedUnit: "1M",
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
}));

export function usePricingUnit() {
  const { selectedUnit, setSelectedUnit } = usePricingUnitStore();

  const convertPriceByUnit = (
    price: number | null | undefined,
    currentUnit?: string
  ): number | null => {
    if (price === null || price === undefined) return null;

    // IMPORTANT: The parseTokenPricing function always converts prices to per 1M tokens
    // So we assume the input price is always per 1M tokens, regardless of currentUnit
    // The currentUnit is just for reference of what the original billing unit was

    if (selectedUnit === "1M") {
      return price; // Keep as is (per 1M tokens)
    }

    if (selectedUnit === "1K") {
      return price / KILOS_PER_MEGA; // Convert from per 1M to per 1K (price should be 1024x smaller)
    }

    return price;
  };

  const formatPricingUnit = (): string => {
    return selectedUnit === "1K" ? "1K Tokens" : "1M Tokens";
  };

  const getUnitMultiplier = (): number => {
    return selectedUnit === "1K" ? TOKENS_PER_KILO : TOKENS_PER_MEGA;
  };

  return {
    selectedUnit,
    setSelectedUnit,
    convertPriceByUnit,
    formatPricingUnit,
    getUnitMultiplier,
  };
}