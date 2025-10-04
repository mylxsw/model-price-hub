import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CatalogModel, formatReleaseDate, normalizeStringArray } from "./ModelList";
import { PriceDisplay } from "./PriceDisplay";

const TOKENS_PER_KILO = 1024;
const TOKENS_PER_MEGA = TOKENS_PER_KILO * 1024;

const readField = <T = unknown>(model: Record<string, unknown>, ...keys: string[]): T | undefined => {
  if (!model) return undefined;
  for (const key of keys) {
    if (key && Object.prototype.hasOwnProperty.call(model, key)) {
      return model[key] as T;
    }
  }
  return undefined;
};

interface ModelComparisonTableProps {
  models: CatalogModel[];
  onRemoveModel?: (modelId: number) => void;
  onClear?: () => void;
}

export function ModelComparisonTable({ models, onRemoveModel, onClear }: ModelComparisonTableProps) {
  const columnWidth = models.length ? `${(100 / models.length).toFixed(2)}%` : "auto";

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Feature
              </th>
              {models.map((model) => (
                <th
                  key={model.id}
                  scope="col"
                  className="min-w-[220px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                  style={{ width: columnWidth }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                        <Link
                          href={`/catalog/${model.id}`}
                          className="text-xs font-semibold text-slate-700 transition-colors hover:text-primary dark:text-slate-100 overflow-hidden whitespace-nowrap text-ellipsis"
                          title={model.model} // Show full text on hover
                        >
                          {model.model}
                        </Link>
                        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{model.vendor.name}</div>
                    </div>
                    {onRemoveModel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveModel(model.id)}
                        aria-label={`Remove ${model.model} from comparison`}
                        className="px-2 py-1 text-base leading-none"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pricing
              </th>
              {models.map((model) => {
                const record = model as unknown as Record<string, unknown>;
                const priceModel = readField<string>(record, "priceModel", "price_model");
                const priceCurrency = readField<string>(record, "priceCurrency", "price_currency");
                const priceData = readField<Record<string, unknown> | string>(
                  record,
                  "priceData",
                  "price_data"
                );
                return (
                  <td key={model.id} className="px-4 py-4 align-top" style={{ width: columnWidth }}>
                    <PriceDisplay
                      price={{
                        price_model: priceModel,
                        price_currency: priceCurrency,
                        price_data: priceData
                      }}
                      variant="compact"
                      layout="stacked"
                    />
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Categories
              </th>
              {models.map((model) => {
                const record = model as unknown as Record<string, unknown>;
                const categories = normalizeStringArray(readField(record, "categories", "category"));
                return (
                  <td key={model.id} className="px-4 py-4 align-top" style={{ width: columnWidth }}>
                    {categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Badge key={category} color="primary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
            {(() => {
              const capabilitySets = models.map((model) =>
                normalizeStringArray(
                  readField(model as unknown as Record<string, unknown>, "modelCapability", "model_capability", "capabilities")
                )
              );
              const capabilityLabels = Array.from(new Set(capabilitySets.flat())).sort((a, b) => a.localeCompare(b));

              const licenseSets = models.map((model) =>
                normalizeStringArray(readField(model as unknown as Record<string, unknown>, "license", "licenses"))
              );
              const licenseLabels = Array.from(new Set(licenseSets.flat())).sort((a, b) => a.localeCompare(b));

              const renderPresenceRows = (title: string, items: string[], sets: string[][]) => {
                if (items.length === 0) return null;

                const labelPrefix = title.replace(/s$/, "");

                return items.map((item) => (
                  <tr key={`${title}-${item}`}>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
                    >
                      <span
                        className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-dashed border-slate-400/60 pb-[1px] cursor-help"
                        title={`${labelPrefix}: ${item}`}
                      >
                        {item}
                      </span>
                    </th>
                    {models.map((model, index) => (
                      <td key={`${title}-${item}-${model.id}`} className="px-4 py-3 align-middle" style={{ width: columnWidth }}>
                        {sets[index].includes(item) ? (
                          <span className="text-emerald-500">✔</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ));
              };

              return (
                <>
                  {renderPresenceRows("Capabilities", capabilityLabels, capabilitySets)}
                  {renderPresenceRows("Licenses", licenseLabels, licenseSets)}
                  {(() => {
                    const formatTokens = (value: number | string | undefined | null) => {
                      if (value === undefined || value === null) return null;
                      const numeric = typeof value === "string" ? Number(value) : value;
                      if (!Number.isFinite(numeric) || numeric <= 0) return null;
                      if (numeric >= TOKENS_PER_MEGA) {
                        const millions = Math.round(numeric / TOKENS_PER_MEGA);
                        return `${millions}M tokens`;
                      }
                      if (numeric >= TOKENS_PER_KILO) {
                        const thousands = Math.round(numeric / TOKENS_PER_KILO);
                        return `${thousands}K tokens`;
                      }
                      return `${Math.round(numeric)} tokens`;
                    };

                    const maxContextValues = models.map((model) => {
                      const record = model as unknown as Record<string, unknown>;
                      const maxContext = readField<number | string>(
                        record,
                        "max_context_tokens",
                        "maxContextTokens"
                      );
                      const maxOutput = readField<number | string>(
                        record,
                        "max_output_tokens",
                        "maxOutputTokens"
                      );

                      return {
                        context: formatTokens(maxContext),
                        output: formatTokens(maxOutput)
                      };
                    });

                    const hasContext = maxContextValues.some((entry) => entry.context);
                    const hasOutput = maxContextValues.some((entry) => entry.output);

                    if (!hasContext && !hasOutput) {
                      return null;
                    }

                    return (
                      <>
                        {hasContext && (
                          <tr>
                            <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                MAX CONTEXT
                            </th>
                            {maxContextValues.map((entry, index) => (
                              <td key={`context-${models[index].id}`} className="px-4 py-3 align-middle" style={{ width: columnWidth }}>
                                {entry.context ?? <span className="text-slate-400">—</span>}
                              </td>
                            ))}
                          </tr>
                        )}
                        {hasOutput && (
                          <tr>
                            <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                MAX OUTPUT
                            </th>
                            {maxContextValues.map((entry, index) => (
                              <td key={`output-${models[index].id}`} className="px-4 py-3 align-middle" style={{ width: columnWidth }}>
                                {entry.output ?? <span className="text-slate-400">—</span>}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </>
              );
            })()}
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Release
              </th>
              {models.map((model) => {
                const releaseDate = formatReleaseDate(model.release_date);
                const releaseDisplay = releaseDate ?? "-";
                return (
                  <td key={model.id} className="px-4 py-4 align-top" style={{ width: columnWidth }}>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{releaseDisplay}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Highlights
              </th>
              {models.map((model) => (
                <td key={model.id} className="px-4 py-4 align-top" style={{ width: columnWidth }}>
                  {model.description ? (
                    <DescriptionPreview text={model.description} />
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const highlightMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 text-sm leading-relaxed text-slate-600 last:mb-0 dark:text-slate-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600 last:mb-0 dark:text-slate-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600 last:mb-0 dark:text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="marker:text-slate-400 dark:marker:text-slate-500">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {children}
    </code>
  )
};

function DescriptionPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    if (expanded) {
      setShowToggle(true);
      return;
    }

    const element = contentRef.current;
    if (!element) return;

    const checkOverflow = () => {
      const overflow = element.scrollHeight > element.clientHeight + 1;
      setShowToggle(overflow);
    };

    checkOverflow();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(checkOverflow);
      observer.observe(element);
      return () => observer.disconnect();
    }

    if (typeof window !== "undefined") {
      const timeout = window.setTimeout(checkOverflow, 300);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [text, expanded]);

  const collapsedStyle = expanded
    ? undefined
    : {
        display: "-webkit-box",
        WebkitLineClamp: 10,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden"
      };

  return (
    <div className="text-sm text-slate-600 dark:text-slate-300">
      <div ref={contentRef} style={collapsedStyle} className="whitespace-pre-wrap">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={highlightMarkdownComponents}>
          {text}
        </ReactMarkdown>
      </div>
      {(showToggle || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
