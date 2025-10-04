import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { PriceDisplay } from "./PriceDisplay";

const TOKENS_PER_KILO = 1024;
const TOKENS_PER_MEGA = TOKENS_PER_KILO * 1024;

interface ModelDetailProps {
  model: {
    id: number;
    model: string;
    description?: string;
    vendor: { id: number; name: string };
    model_capability?: unknown;
    price_data?: Record<string, unknown>;
    price_model?: string;
    price_currency?: string;
    license?: unknown;
    model_url?: string;
    note?: string;
    release_date?: string | null;
  };
}

const normalizeStringArray = (input?: unknown): string[] => {
  const expand = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.flatMap((item) => expand(item));
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) || typeof parsed === "string") {
          return expand(parsed);
        }
      } catch (error) {
        // ignore JSON parse errors and fall through to raw string
      }
      return [trimmed];
    }
    return [];
  };

  const deduped: string[] = [];
  for (const entry of expand(input)) {
    const normalized = entry.trim();
    if (normalized && !deduped.includes(normalized)) {
      deduped.push(normalized);
    }
  }
  return deduped;
};


export function ModelDetail({ model }: ModelDetailProps) {
  const record = model as Record<string, unknown>;
  const readField = <T = unknown>(...keys: string[]): T | undefined => {
    for (const key of keys) {
      if (key && Object.prototype.hasOwnProperty.call(record, key)) {
        return record[key] as T;
      }
    }
    return undefined;
  };

  const capabilities = normalizeStringArray(readField("modelCapability", "model_capability", "capabilities"));
  const licenses = normalizeStringArray(readField("license", "licenses"));
  const categories = normalizeStringArray(readField("categories"));
  const releaseDateRaw = readField<string | null>("releaseDate", "release_date");
  const priceData = readField<Record<string, unknown> | string>("priceData", "price_data");
  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;
  const hasValidReleaseDate = releaseDate && !Number.isNaN(releaseDate.getTime());
  const modelUrl = readField<string>("modelUrl", "model_url");
  const maxContextTokens = readField<number | string>("max_context_tokens", "maxContextTokens");
  const maxOutputTokens = readField<number | string>("max_output_tokens", "maxOutputTokens");
  const modelImage =
    (model as any).model_image ?? (model as any).modelImage ?? (model as any).image ?? null;

  const cardTitle = modelImage ? (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <img src={modelImage as string} alt={`${model.model} logo`} className="h-full w-full object-cover" />
      </span>
      <span>{model.model}</span>
    </div>
  ) : (
    model.model
  );

  const markdownComponents: Components = {
    p: ({ children }) => (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</ol>
    ),
    li: ({ children }) => <li className="marker:text-slate-400">{children}</li>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100 dark:bg-slate-800">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-200 pl-4 text-sm italic text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {children}
      </blockquote>
    )
  };

  return (
    <div className="space-y-8">
      <Card title={cardTitle} actions={<Badge color="primary">{model.vendor.name}</Badge>}>
        <div className="mt-4 space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {model.description && (
            <div className="space-y-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {model.description}
              </ReactMarkdown>
            </div>
          )}
          {modelUrl && (
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Documentation</span>
              <a href={modelUrl} target="_blank" rel="noreferrer" className="block text-primary">
                {modelUrl}
              </a>
            </div>
          )}
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Released {hasValidReleaseDate
              ? new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(releaseDate)
              : "-"}
          </div>
          {(capabilities.length > 0 || licenses.length > 0) && (
            <div className="space-y-3">
              {capabilities.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capabilities</span>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((capability) => (
                      <Badge key={capability}>{capability}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {licenses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Licenses</span>
                  <div className="flex flex-wrap gap-2">
                    {licenses.map((license) => (
                      <Badge key={license} color="success">
                        {license}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} color="primary">
                  {category}
                </Badge>
              ))}
            </div>
          )}
          {(maxContextTokens || maxOutputTokens) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {maxContextTokens && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Max context</span>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatTokens(maxContextTokens)}</p>
                </div>
              )}
              {maxOutputTokens && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Max output</span>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatTokens(maxOutputTokens)}</p>
                </div>
              )}
            </div>
          )}
          {model.note && <p className="text-sm text-slate-500 dark:text-slate-400">{model.note}</p>}
        </div>
      </Card>
      <Card title="Pricing" description="Detailed pricing information across different tiers and usage models.">
        <PriceDisplay
          price={{
            price_model: readField<string>("priceModel", "price_model"),
            price_currency: readField<string>("priceCurrency", "price_currency"),
            price_data: priceData
          }}
          variant="detailed"
        />
      </Card>
    </div>
  );
}

function formatTokens(value?: number | string | null): string {
  if (value === undefined || value === null) {
    return "—";
  }
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "—";
  }
  if (numeric >= TOKENS_PER_MEGA) {
    const millions = Math.round(numeric / TOKENS_PER_MEGA);
    return `${millions}M tokens`;
  }
  if (numeric >= TOKENS_PER_KILO) {
    const thousands = Math.round(numeric / TOKENS_PER_KILO);
    return `${thousands}K tokens`;
  }
  return `${Math.round(numeric)} tokens`;
}
