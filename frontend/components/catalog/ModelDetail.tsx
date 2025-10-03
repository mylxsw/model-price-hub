import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { PriceDisplay } from "./PriceDisplay";

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
  const capabilities = normalizeStringArray((model as any).modelCapability);
  const licenses = normalizeStringArray((model as any).license);
  const releaseDateRaw = (model as any).release_date;
  const priceData = (model as any).priceData;
  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;
  const modelUrl = (model as any).modelUrl;
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
          {releaseDate && !Number.isNaN(releaseDate.getTime()) && (
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Released {new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(releaseDate)}
            </div>
          )}
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <Badge key={capability}>{capability}</Badge>
              ))}
            </div>
          )}
          {licenses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {licenses.map((license) => (
                <Badge key={license} color="success">
                  {license}
                </Badge>
              ))}
            </div>
          )}
          {model.note && <p className="text-sm text-slate-500 dark:text-slate-400">{model.note}</p>}
        </div>
      </Card>
      <Card title="Pricing" description="Detailed pricing information across different tiers and usage models.">
        <PriceDisplay
          price={{
            price_model: (model as any).priceModel,
            price_currency: (model as any).priceCurrency,
            price_data: priceData
          }}
          variant="detailed"
        />
      </Card>
    </div>
  );
}
