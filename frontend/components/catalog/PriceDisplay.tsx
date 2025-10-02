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

const parseTokenPricing = (priceData: unknown): TokenPricing | null => {
  if (typeof priceData !== "object" || !priceData) return null;

  const data = priceData as Record<string, unknown>;
  const rootCurrency = typeof data.currency === "string" ? data.currency : undefined;

  const buildResult = (input?: number, output?: number, currency?: string): TokenPricing | null => {
    if (input === undefined && output === undefined) {
      return null;
    }
    const resolvedCurrency = currency ?? rootCurrency ?? "USD";
    return {
      input,
      output,
      per: MILLION_TOKEN_LABEL,
      currency: resolvedCurrency
    };
  };

  if (data.base && typeof data.base === "object") {
    const base = data.base as Record<string, unknown>;
    const baseCurrency = typeof base.currency === "string" ? base.currency : undefined;

    const inputToken = base.input_token_1m;
    const outputToken = base.output_token_1m;

    if (isNumber(inputToken) || isNumber(outputToken)) {
      return buildResult(
        isNumber(inputToken) ? inputToken : undefined,
        isNumber(outputToken) ? outputToken : undefined,
        baseCurrency
      );
    }

    const baseInput = convertToPerMillion(base.input, base.per);
    const baseOutput = convertToPerMillion(base.output, base.per);

    const baseResult = buildResult(baseInput, baseOutput, baseCurrency);
    if (baseResult) {
      return baseResult;
    }
  }

  const directResult = buildResult(
    convertToPerMillion(data.input, data.per),
    convertToPerMillion(data.output, data.per),
    rootCurrency
  );
  if (directResult) {
    return directResult;
  }

  if (data.pricing && typeof data.pricing === "object") {
    const pricing = data.pricing as Record<string, unknown>;
    const pricingCurrency = typeof pricing.currency === "string" ? pricing.currency : undefined;
    const pricingResult = buildResult(
      convertToPerMillion(pricing.input, pricing.per),
      convertToPerMillion(pricing.output, pricing.per),
      pricingCurrency
    );
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
    const tokenPricing = parseTokenPricing(price_data);

    if (variant === "compact") {
      if (tokenPricing) {
        const { input, output, currency: tokenCurrency, per } = tokenPricing;
        const currency = tokenCurrency || price_currency;

        if (input !== undefined && output !== undefined) {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {formatTokenPrice(input, currency)} - {formatTokenPrice(output, currency)}
              </div>
              <div className="text-slate-500">per {per}</div>
            </div>
          );
        }

        if (input !== undefined) {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {formatTokenPrice(input, currency)}
              </div>
              <div className="text-slate-500">per {per}</div>
            </div>
          );
        }

        if (output !== undefined) {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {formatTokenPrice(output, currency)}
              </div>
              <div className="text-slate-500">per {per}</div>
            </div>
          );
        }
      }
      return <Badge color="primary">Token-based</Badge>;
    }

    // Detailed view
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color="primary">Token-based</Badge>
          {tokenPricing && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Pricing per {tokenPricing.per}
            </span>
          )}
        </div>

        {tokenPricing && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="grid gap-2 text-sm">
              {tokenPricing.input !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Input:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatTokenPrice(tokenPricing.input, tokenPricing.currency || price_currency)}
                  </span>
                </div>
              )}
              {tokenPricing.output !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Output:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatTokenPrice(tokenPricing.output, tokenPricing.currency || price_currency)}
                  </span>
                </div>
              )}
            </div>
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
      <div className="space-y-3">
        <Badge color="primary">{price_model}</Badge>

        {tiers.length > 0 && (
          <div className="space-y-2">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {tier.name}
                  </h4>
                  <span className="font-semibold text-primary">
                    {formatCurrency(tier.price, tier.currency || price_currency)}
                  </span>
                </div>

                {tier.features && tier.features.length > 0 && (
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-current"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color="primary">Per call</Badge>
          {callPricing && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Pricing per API call
            </span>
          )}
        </div>

        {callPricing && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Price per call: </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(callPricing.price, callPricing.currency || price_currency)}
              </span>
            </div>
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
