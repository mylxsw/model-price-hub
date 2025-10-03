"use client";

import { useEffect, useMemo, useState } from "react";

import { useCurrency } from "../../lib/hooks/useCurrency";
import { usePricingUnit } from "../../lib/hooks/usePricingUnit";
import { Badge } from "../ui/Badge";

export interface PriceInfo {
  price_model?: string;
  price_currency?: string;
  price_data?: Record<string, unknown> | string;
}

type PriceLayout = "inline" | "stacked";

interface PriceDisplayProps {
  price: PriceInfo;
  variant?: "compact" | "detailed";
  layout?: PriceLayout;
}

interface TokenPricing {
  input?: number;
  cached?: number;
  output?: number;
  per: string;
  currency?: string;
}

interface CallPricing {
  price: number;
  currency?: string;
}

interface TierPricing {
  name: string;
  billing: "token" | "requests";
  unit: string;
  tokenRates?: {
    input: number | null;
    cached: number | null;
    output: number | null;
  };
  requestPrice?: number | null;
  isFree?: boolean;
}

const MILLION_TOKEN_LABEL = "1M Tokens";

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const convertToPerMillion = (amount: unknown, per?: unknown): number | undefined => {
  if (!isNumber(amount)) return undefined;
  if (typeof per !== "string") return amount;

  const normalized = per.toLowerCase();

  if (normalized.includes("1m") || normalized.includes("million")) {
    return amount;
  }

  if (normalized.includes("1k") || normalized.includes("1000")) {
    return amount * 1000;
  }

  if (normalized.includes("token")) {
    return amount * 1_000_000;
  }

  return amount;
};

const parseTokenPricing = (priceData: unknown, defaultCurrency: string): TokenPricing | null => {
  if (typeof priceData !== "object" || !priceData) return null;

  const data = priceData as Record<string, unknown>;
  const rootCurrency = typeof data.currency === "string" ? data.currency : undefined;

  const buildResult = (values: {
    input?: number;
    output?: number;
    cached?: number;
    currency?: string;
    per?: string;
  }): TokenPricing | null => {
    const { input, output, cached, currency, per } = values;
    if (input === undefined && output === undefined && cached === undefined) {
      return null;
    }
    const resolvedCurrency = currency ?? rootCurrency ?? defaultCurrency ?? "USD";
    return {
      input,
      output,
      cached,
      per: per ?? MILLION_TOKEN_LABEL,
      currency: resolvedCurrency
    };
  };

  if (data.base && typeof data.base === "object") {
    const base = data.base as Record<string, unknown>;
    const baseCurrency = typeof base.currency === "string" ? base.currency : undefined;

    const inputToken = base.input_token_1m;
    const outputToken = base.output_token_1m;
    const cachedToken = base.input_token_cached_1m ?? base.cached_input_token_1m;

    if (isNumber(inputToken) || isNumber(outputToken) || isNumber(cachedToken)) {
      return buildResult({
        input: isNumber(inputToken) ? inputToken : undefined,
        output: isNumber(outputToken) ? outputToken : undefined,
        cached: isNumber(cachedToken) ? cachedToken : undefined,
        currency: baseCurrency
      });
    }

    const baseInput = convertToPerMillion(base.input, base.per);
    const baseOutput = convertToPerMillion(base.output, base.per);
    const baseCached = convertToPerMillion(base.cached, base.per);

    const baseResult = buildResult({
      input: baseInput,
      output: baseOutput,
      cached: baseCached,
      currency: baseCurrency,
      per: typeof base.per === "string" ? base.per : undefined
    });
    if (baseResult) {
      return baseResult;
    }
  }

  if (data.pricing && typeof data.pricing === "object") {
    const pricing = data.pricing as Record<string, unknown>;
    const pricingCurrency = typeof pricing.currency === "string" ? pricing.currency : undefined;
    const pricingResult = buildResult({
      input: convertToPerMillion(pricing.input, pricing.per),
      output: convertToPerMillion(pricing.output, pricing.per),
      cached: convertToPerMillion(pricing.cached, pricing.per),
      currency: pricingCurrency,
      per: typeof pricing.per === "string" ? pricing.per : undefined
    });
    if (pricingResult) {
      return pricingResult;
    }
  }

  return null;
};

const parseCallPricing = (priceData: unknown): CallPricing | null => {
  if (typeof priceData !== "object" || !priceData) return null;

  const data = priceData as Record<string, unknown>;

  if (data.base && typeof data.base === "object") {
    const base = data.base as Record<string, unknown>;
    const pricePerCall = base.price_per_call;
    if (typeof pricePerCall === "number") {
      const currency = typeof base.currency === "string" ? base.currency : undefined;
      return {
        price: pricePerCall,
        currency
      };
    }
  }

  return null;
};

const parseTierPricing = (priceData: unknown): TierPricing[] => {
  if (!priceData || typeof priceData !== "object") return [];

  const normalizeBilling = (value: unknown, unit: string): "token" | "requests" => {
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "token" || normalized === "tokens") return "token";
      if (normalized === "request" || normalized === "requests") return "requests";
    }
    if (unit.toLowerCase().includes("token")) {
      return "token";
    }
    return "requests";
  };

  const ensureUnit = (billing: "token" | "requests", unit: unknown): string => {
    if (typeof unit === "string" && unit.trim()) {
      if (billing === "token") {
        const normalized = unit.trim().toLowerCase();
        if (normalized.includes("1m")) return "1M Tokens";
        if (normalized.includes("1k")) return "1K Tokens";
      }
      return unit.trim();
    }
    return billing === "token" ? "1K Tokens" : "Requests";
  };

  const parsePrice = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const tiersValue = (priceData as Record<string, unknown>).tiers;
  let tierEntries: Array<{ name: string; data: Record<string, unknown> }> = [];

  if (Array.isArray(tiersValue)) {
    tierEntries = tiersValue
      .filter((tier): tier is Record<string, unknown> => tier !== null && typeof tier === "object")
      .map((tier, index) => ({ name: (tier.name as string) ?? `Tier ${index + 1}`, data: tier }));
  } else if (tiersValue && typeof tiersValue === "object") {
    tierEntries = Object.entries(tiersValue).map(([name, tier], index) => {
      const record = tier && typeof tier === "object" ? (tier as Record<string, unknown>) : { price_per_unit: tier };
      return {
        name: typeof (record as Record<string, unknown>)?.name === "string" ? ((record as Record<string, unknown>).name as string) : name || `Tier ${index + 1}`,
        data: record
      };
    });
  }

  return tierEntries.map(({ name, data }) => {
    const unit = ensureUnit("token", data.unit);
    const billing = normalizeBilling(data.billing, unit);
    const resolvedUnit = ensureUnit(billing, data.unit);
    const requestPrice = parsePrice(data.price_per_unit ?? data.price);
    const isFree = Boolean(
      (typeof data.is_free === "boolean" ? data.is_free : undefined) ??
        (typeof data.isFree === "boolean" ? data.isFree : undefined)
    );

    if (billing === "token") {
      const input = parsePrice(data.input_price_per_unit ?? data.inputPrice ?? requestPrice);
      const cached = parsePrice(data.cached_price_per_unit ?? data.cachedPrice ?? null);
      const output = parsePrice(data.output_price_per_unit ?? data.outputPrice ?? requestPrice);
      return {
        name,
        billing,
        unit: resolvedUnit,
        tokenRates: {
          input: isFree ? null : input,
          cached: isFree ? null : cached,
          output: isFree ? null : output
        },
        isFree
      };
    }

    return {
      name,
      billing,
      unit: resolvedUnit,
      requestPrice: isFree ? null : requestPrice,
      isFree
    };
  });
};

const formatPerSuffix = (per?: string): string => {
  if (!per) return "/1M Tokens";
  const trimmed = per.trim();
  if (!trimmed) return "";
  const withoutPer = trimmed.replace(/^per\s+/i, "");
  const capitalized = withoutPer
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
  return `/${capitalized || "1M Tokens"}`;
};

const firstDefined = (...values: Array<number | null | undefined>): number | null => {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
};

export function PriceDisplay({ price, variant = "compact", layout = "inline" }: PriceDisplayProps) {
  const { price_model, price_currency = "USD", price_data } = price;
  const normalizedModel = price_model?.toLowerCase();
  const { formatCurrency } = useCurrency();
  const { selectedUnit, convertPriceByUnit, formatPricingUnit } = usePricingUnit();

  // Create a specialized conversion function for tiered pricing
  const convertTierPriceByUnit = (
    price: number | null | undefined,
    currentUnit: string
  ): number | null => {
    if (price === null || price === undefined) return null;

    const normalizedCurrentUnit = currentUnit.toLowerCase().replace(/\s+/g, "");
    const normalizedSelectedUnit = selectedUnit.toLowerCase();

    // If the units are the same, no conversion needed
    if (
      (normalizedCurrentUnit.includes("1k") && normalizedSelectedUnit === "1k") ||
      (normalizedCurrentUnit.includes("1m") && normalizedSelectedUnit === "1m")
    ) {
      return price;
    }

    // Convert from 1M to 1K (divide by 1000 - 1K should be cheaper)
    if (normalizedCurrentUnit.includes("1m") && normalizedSelectedUnit === "1k") {
      return price / 1000;
    }

    // Convert from 1K to 1M (multiply by 1000 - 1M should be more expensive)
    if (normalizedCurrentUnit.includes("1k") && normalizedSelectedUnit === "1m") {
      return price * 1000;
    }

    // Default case: assume it's already in the right unit
    return price;
  };

  const tokenPricing = useMemo(() => parseTokenPricing(price_data, price_currency), [price_data, price_currency]);
  const tiers = useMemo(() => parseTierPricing(price_data), [price_data]);
  const callPricing = useMemo(() => parseCallPricing(price_data), [price_data]);
  const tierNamesKey = useMemo(() => tiers.map((tier) => tier.name).join("|"), [tiers]);
  const [activeTierIndex, setActiveTierIndex] = useState(0);

  useEffect(() => {
    if (normalizedModel === "tiered" || normalizedModel === "subscription") {
      setActiveTierIndex(0);
    }
  }, [tierNamesKey, normalizedModel]);

  if (!price_model) {
    return <span className="text-slate-500">Pricing unknown</span>;
  }

  if (normalizedModel === "free") {
    if (variant === "compact") {
      return <Badge color="success">Free</Badge>;
    }
    return (
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <Badge color="success">Free</Badge>
        <p>This model is free to use based on the latest catalog information.</p>
      </div>
    );
  }

  if (normalizedModel === "unknown") {
    if (variant === "compact") {
      return <span className="text-xs text-slate-500 dark:text-slate-400">Pricing unavailable</span>;
    }
    return (
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <Badge color="primary">Pricing unknown</Badge>
        <p>Pricing for this model is not yet available. Check back later or contact the provider.</p>
      </div>
    );
  }

  if (normalizedModel === "token" || normalizedModel === "tokens") {
    if (variant === "compact") {
      if (tokenPricing) {
        const currency = tokenPricing.currency || price_currency;
        const convertedUnit = formatPricingUnit();
        const perSuffix = `/${convertedUnit}`;

        interface TokenEntryDisplay {
          label: string;
          priceText: string;
          suffix: string;
        }

        const buildEntry = (label: string, amount?: number): TokenEntryDisplay | null => {
          if (amount === undefined) {
            return null;
          }
          const converted = convertPriceByUnit(amount, tokenPricing.per);
          if (converted === null) {
            return null;
          }
          return {
            label,
            priceText: formatCurrency(converted, currency),
            suffix: perSuffix
          };
        };

        const entries = [
          buildEntry("Input", tokenPricing.input),
          buildEntry("Output", tokenPricing.output),
          buildEntry("Cached", tokenPricing.cached)
        ].filter((entry): entry is TokenEntryDisplay => Boolean(entry));

        if (entries.length > 0) {
          const isStacked = layout === "stacked";

          if (isStacked) {
            return (
              <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Token pricing
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entries.map((entry) => (
                      <span
                        key={entry.label}
                        className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{entry.label}</span>
                        <span>
                          <span className="font-semibold text-primary">{entry.priceText}</span>
                          <span className="ml-1 text-slate-500 dark:text-slate-400">{entry.suffix}</span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

            return (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                {entries.map((entry) => (
                  <span
                    key={entry.label}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{entry.label}</span>
                    <span>
                      <span className="font-semibold text-primary">{entry.priceText}</span>
                      <span className="ml-1 text-slate-500 dark:text-slate-400">{entry.suffix}</span>
                    </span>
                  </span>
                ))}
              </div>
            );
          }
      }
      return <span className="text-xs text-slate-500 dark:text-slate-400">Token pricing unavailable</span>;
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Badge color="primary">Token-based</Badge>
          <span>Pricing per {formatPricingUnit()}</span>
        </div>

        {tokenPricing ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokenPricing.input !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Input tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(convertPriceByUnit(tokenPricing.input, tokenPricing.per), tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {formatPricingUnit()}</span>
              </div>
            )}
            {tokenPricing.cached !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Cached tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(convertPriceByUnit(tokenPricing.cached, tokenPricing.per), tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {formatPricingUnit()}</span>
              </div>
            )}
            {tokenPricing.output !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Output tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(convertPriceByUnit(tokenPricing.output, tokenPricing.per), tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {formatPricingUnit()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Token pricing information is not available for this model. Contact the vendor for details.
          </div>
        )}
      </div>
    );
  }

  if (normalizedModel === "tiered" || normalizedModel === "subscription") {
    interface TierEntryDisplay {
      label: string;
      priceText: string;
      suffix: string;
    }

    const buildTokenEntries = (tier: TierPricing): TierEntryDisplay[] => {
      if (tier.isFree) {
        return [{ label: "Status", priceText: "Free", suffix: "" }];
      }
      if (tier.billing !== "token" || !tier.tokenRates) return [];
      const convertedUnit = formatPricingUnit();
      const suffix = `/${convertedUnit}`;
      const entries = [
        tier.tokenRates.input !== null && tier.tokenRates.input !== undefined
          ? {
              label: "Input",
              priceText: formatCurrency(convertTierPriceByUnit(tier.tokenRates.input, tier.unit), price_currency),
              suffix
            }
          : null,
        tier.tokenRates.cached !== null && tier.tokenRates.cached !== undefined
          ? {
              label: "Cached",
              priceText: formatCurrency(convertTierPriceByUnit(tier.tokenRates.cached, tier.unit), price_currency),
              suffix
            }
          : null,
        tier.tokenRates.output !== null && tier.tokenRates.output !== undefined
          ? {
              label: "Output",
              priceText: formatCurrency(convertTierPriceByUnit(tier.tokenRates.output, tier.unit), price_currency),
              suffix
            }
          : null
      ].filter((entry): entry is TierEntryDisplay => Boolean(entry));
      return entries;
    };

    const buildTierSummary = (tier: TierPricing): string => {
      if (tier.isFree) {
        return "Free tier";
      }
      const convertedUnit = formatPricingUnit();
      if (tier.billing === "token" && tier.tokenRates) {
        const primary = firstDefined(tier.tokenRates.input, tier.tokenRates.output, tier.tokenRates.cached);
        if (primary !== null) {
          return `${formatCurrency(convertTierPriceByUnit(primary, tier.unit), price_currency)} / ${convertedUnit}`;
        }
      }
      if (tier.billing === "requests" && tier.requestPrice !== null && tier.requestPrice !== undefined) {
        return `${formatCurrency(tier.requestPrice, price_currency)} / ${tier.unit}`;
      }
      return "Custom pricing";
    };

    if (variant === "compact" && layout === "stacked") {
      if (tiers.length === 0) {
        return <span className="text-xs text-slate-500 dark:text-slate-400">Tiered pricing unavailable</span>;
      }

      return (
        <div className="flex flex-col gap-3">
          {tiers.map((tier, index) => {
            const entries = buildTokenEntries(tier);
            return (
              <div
                key={`${tier.name}-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tier.name}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {tier.billing === "token" ? (
                    tier.isFree ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        Free tier
                      </span>
                    ) : entries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {entries.map((entry) => (
                          <span
                            key={entry.label}
                            className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {entry.label}
                            </span>
                            <span>
                              <span className="font-semibold text-primary">{entry.priceText}</span>
                              {entry.suffix && (
                                <span className="ml-1 text-slate-500 dark:text-slate-400">{entry.suffix}</span>
                              )}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No token rates</span>
                    )
                  ) : (
                    <span>
                      {tier.isFree
                        ? "Free tier"
                        : tier.requestPrice !== null && tier.requestPrice !== undefined
                          ? `${formatCurrency(tier.requestPrice, price_currency)} / ${tier.unit}`
                          : "Custom pricing"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (variant === "compact") {
      if (tiers.length === 0) {
        return <span className="text-xs text-slate-500 dark:text-slate-400">Tiered pricing unavailable</span>;
      }

      const safeIndex = activeTierIndex < tiers.length ? activeTierIndex : 0;
      const activeTier = tiers[safeIndex];
      const entries = buildTokenEntries(activeTier);

      return (
        <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Tier</span>
            {tiers.length > 1 ? (
              <select
                value={String(safeIndex)}
                onChange={(event) => setActiveTierIndex(Number(event.target.value))}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Select pricing tier"
              >
                {tiers.map((tier, index) => (
                  <option key={`${tier.name}-${index}`} value={index}>
                    {tier.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {activeTier.name}
              </span>
            )}
          </div>
          {activeTier.billing === "token" ? (
            activeTier.isFree ? (
              <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                Free tier
              </span>
            ) : entries.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {entries.map((entry) => (
                  <span
                    key={entry.label}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {entry.label}
                    </span>
                    <span>
                      <span className="font-semibold text-primary">{entry.priceText}</span>
                      {entry.suffix && (
                        <span className="ml-1 text-slate-500 dark:text-slate-400">{entry.suffix}</span>
                      )}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">No token rates</span>
            )
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {activeTier.isFree
                ? "Free tier"
                : activeTier.requestPrice !== null && activeTier.requestPrice !== undefined
                  ? `${formatCurrency(activeTier.requestPrice, price_currency)} / ${activeTier.unit}`
                  : "Custom pricing"}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Badge color="primary">{price_model}</Badge>
          {tiers.length > 0 && <span>{tiers.length} tier{tiers.length > 1 ? "s" : ""} available</span>}
        </div>

        {tiers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tiers.map((tier, index) => (
              <div
                key={`${tier.name}-${index}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tier.name}</h4>
                    <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {tier.billing === "token" ? "Token billing" : "Per request"} · {tier.billing === "token" ? formatPricingUnit() : tier.unit}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-primary">{buildTierSummary(tier)}</span>
                </div>
                {tier.billing === "token" && tier.tokenRates && (
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {tier.isFree ? (
                      <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        Free tier
                      </span>
                    ) : (
                      <>
                        {buildTokenEntries(tier).map((entry) => (
                          <span
                            key={entry.label}
                            className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {entry.label}
                            </span>
                            <span>
                              <span className="font-semibold text-primary">{entry.priceText}</span>
                              {entry.suffix && (
                                <span className="ml-1 text-slate-500 dark:text-slate-400">{entry.suffix}</span>
                              )}
                            </span>
                          </span>
                        ))}
                        {tier.tokenRates.input === null &&
                          tier.tokenRates.cached === null &&
                          tier.tokenRates.output === null && <span>No token rates configured.</span>}
                      </>
                    )}
                  </div>
                )}
                {tier.billing === "requests" && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {tier.isFree
                      ? "Free tier"
                      : tier.requestPrice !== null && tier.requestPrice !== undefined
                        ? `${formatCurrency(tier.requestPrice, price_currency)} / ${tier.unit}`
                        : "Custom pricing"}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Tier information is not available for this model. Visit the vendor site for more details.
          </div>
        )}
      </div>
    );
  }

  if (normalizedModel === "call") {
    if (variant === "compact") {
      if (callPricing && typeof callPricing.price === "number") {
        const currency = callPricing.currency || price_currency;
        const priceValue = formatCurrency(callPricing.price, currency);
        const isStacked = layout === "stacked";

        if (isStacked) {
          return (
            <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Per request
                  </span>
                  <span className="text-sm font-semibold text-primary">{priceValue}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Price</span>
                    {priceValue} / call
                  </span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Per call</span>
              {priceValue}
            </span>
          </div>
        );
      }
      return <span className="text-xs text-slate-500 dark:text-slate-400">Per-call pricing unavailable</span>;
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Badge color="primary">Per call</Badge>
          <span>Simple call-based billing</span>
        </div>

        {callPricing ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60 sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Price per call
            </span>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(callPricing.price, callPricing.currency || price_currency)}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ideal for workloads with predictable request volumes.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Per-call pricing details are unavailable. Contact the provider for up-to-date rates.
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return <Badge color="primary">{price_model}</Badge>;
  }

  return (
    <div className="space-y-2">
      <Badge color="primary">{price_model}</Badge>
      {price_data && <div className="text-xs text-slate-600 dark:text-slate-400">Custom pricing - see details</div>}
    </div>
  );
}
