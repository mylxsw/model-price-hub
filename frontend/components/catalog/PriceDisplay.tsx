import { Badge } from "../ui/Badge";

export interface PriceInfo {
  price_model?: string;
  price_currency?: string;
  price_data?: Record<string, unknown> | string;
}

interface PriceDisplayProps {
  price: PriceInfo;
  variant?: "compact" | "detailed";
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
  price: number | string;
  features?: string[];
  currency?: string;
}

const MILLION_TOKEN_LABEL = "1M tokens";

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

  const directResult = buildResult({
    input: convertToPerMillion(data.input, data.per),
    output: convertToPerMillion(data.output, data.per),
    cached: convertToPerMillion(data.cached, data.per),
    currency: rootCurrency,
    per: typeof data.per === "string" ? data.per : undefined
  });
  if (directResult) {
    return directResult;
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

  // Handle the actual API structure with base object
  if (data.base && typeof data.base === "object") {
    const base = data.base as Record<string, unknown>;

    // Check for price_per_call field
    const pricePerCall = base.price_per_call;
    if (typeof pricePerCall === "number") {
      return {
        price: pricePerCall,
        currency: "USD"
      };
    }
  }

  return null;
};

const parseTierPricing = (priceData: unknown): TierPricing[] => {
  if (!priceData || typeof priceData !== "object") return [];

  const data = priceData as Record<string, unknown>;
  const tiers: TierPricing[] = [];

  // Handle tiers object
  if (data.tiers && typeof data.tiers === "object") {
    const tiersData = data.tiers as Record<string, unknown>;
    Object.entries(tiersData).forEach(([name, tier]) => {
      if (typeof tier === "object" && tier !== null) {
        const tierObj = tier as Record<string, unknown>;
        tiers.push({
          name,
          price: tierObj.price as number | string,
          features: tierObj.features as string[] | undefined,
          currency: tierObj.currency as string | undefined
        });
      }
    });
  }

  // Handle direct object with tier names
  else {
    Object.entries(data).forEach(([name, value]) => {
      if (typeof value === "object" && value !== null && name !== "currency") {
        const tierObj = value as Record<string, unknown>;
        const tierPrice = tierObj.price as number | string | undefined;
        tiers.push({
          name,
          price: tierPrice !== undefined ? tierPrice : (typeof value === "number" || typeof value === "string") ? value : "Custom",
          features: tierObj.features as string[] | undefined,
          currency: tierObj.currency as string || data.currency as string || "USD"
        });
      }
    });
  }

  return tiers;
};

const formatCurrency = (amount: number | string, currency = "USD"): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return amount as string;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: num < 1 ? 4 : 2,
    maximumFractionDigits: num < 1 ? 4 : 2
  });

  return formatter.format(num);
};

const formatTokenPrice = (price: number, currency = "USD"): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 4 : 2
  });
  return formatter.format(price);
};

export function PriceDisplay({ price, variant = "compact" }: PriceDisplayProps) {
  const { price_model, price_currency = "USD", price_data } = price;

  if (!price_model) {
    return <span className="text-slate-500">Pricing unknown</span>;
  }

  // Handle free pricing
  if (price_model.toLowerCase() === "free") {
    return <Badge color="success">Free</Badge>;
  }

  // Handle token-based pricing
  if (price_model.toLowerCase() === "token" || price_model.toLowerCase() === "tokens") {
    const tokenPricing = parseTokenPricing(price_data, price_currency);

    if (variant === "compact") {
      if (tokenPricing) {
        const currency = tokenPricing.currency || price_currency;
        const entries = [
          tokenPricing.input !== undefined
            ? { label: "Input", value: formatTokenPrice(tokenPricing.input, currency) }
            : null,
          tokenPricing.cached !== undefined
            ? { label: "Cached", value: formatTokenPrice(tokenPricing.cached, currency) }
            : null,
          tokenPricing.output !== undefined
            ? { label: "Output", value: formatTokenPrice(tokenPricing.output, currency) }
            : null
        ].filter(Boolean) as Array<{ label: string; value: string }>;

        if (entries.length > 0) {
          return (
            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                {entries.map((entry) => (
                  <span
                    key={entry.label}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {entry.label}
                    </span>
                    {entry.value}
                  </span>
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                per {tokenPricing.per}
              </span>
            </div>
          );
        }
      }
      return <Badge color="primary">Token-based</Badge>;
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Badge color="primary">Token-based</Badge>
          <span>Pricing per {tokenPricing?.per ?? MILLION_TOKEN_LABEL}</span>
        </div>

        {tokenPricing ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokenPricing.input !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Input tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatTokenPrice(tokenPricing.input, tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {tokenPricing.per}</span>
              </div>
            )}
            {tokenPricing.cached !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Cached tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatTokenPrice(tokenPricing.cached, tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {tokenPricing.per}</span>
              </div>
            )}
            {tokenPricing.output !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Output tokens
                </span>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatTokenPrice(tokenPricing.output, tokenPricing.currency || price_currency)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">per {tokenPricing.per}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Detailed token pricing unavailable. Check vendor documentation for specifics.
          </div>
        )}
      </div>
    );
  }

  // Handle tiered pricing
  if (price_model.toLowerCase() === "tiered" || price_model.toLowerCase() === "subscription") {
    const tiers = parseTierPricing(price_data);

    if (variant === "compact") {
      if (tiers.length > 0) {
        const startingPrice = tiers.reduce((min, tier) => {
          const price = typeof tier.price === "number" ? tier.price : parseFloat(tier.price as string) || Infinity;
          return price < min ? price : min;
        }, Infinity);

        if (startingPrice !== Infinity) {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-700 dark:text-slate-300">
                From {formatCurrency(startingPrice, price_currency)}
              </div>
              <div className="text-slate-500">
                {tiers.length} tier{tiers.length > 1 ? "s" : ""}
              </div>
            </div>
          );
        }
      }
      return <Badge color="primary">{price_model}</Badge>;
    }

    // Detailed view
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
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tier.name}</h4>
                    {tier.features && tier.features.length > 0 && (
                      <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {tier.features.length} feature{tier.features.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(tier.price, tier.currency || price_currency)}
                  </span>
                </div>

                {tier.features && tier.features.length > 0 && (
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
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

  // Handle call-based pricing
  if (price_model.toLowerCase() === "call") {
    const callPricing = parseCallPricing(price_data);

    if (variant === "compact") {
      if (callPricing && callPricing.price) {
        return (
          <div className="text-xs">
            <div className="font-medium text-slate-700 dark:text-slate-300">
              {formatCurrency(callPricing.price, callPricing.currency || price_currency)}
            </div>
            <div className="text-slate-500">per call</div>
          </div>
        );
      }
      return <Badge color="primary">Per call</Badge>;
    }

    // Detailed view
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

  // Handle other pricing models
  if (variant === "compact") {
    return <Badge color="primary">{price_model}</Badge>;
  }

  return (
    <div className="space-y-2">
      <Badge color="primary">{price_model}</Badge>
      {price_data && (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Custom pricing - see details
        </div>
      )}
    </div>
  );
}
