import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface ModelDetailProps {
  model: {
    id: number;
    model: string;
    description?: string;
    vendor: { id: number; name: string };
    model_capability?: string[];
    price_data?: Record<string, unknown>;
    price_model?: string;
    price_currency?: string;
    license?: string[];
    model_url?: string;
    note?: string;
  };
}

function renderPricing(priceData?: Record<string, unknown>) {
  if (!priceData) return <p className="text-sm text-slate-400">No pricing data provided.</p>;
  return (
    <div className="space-y-3 text-sm">
      {Object.entries(priceData).map(([tier, value]) => (
        <div key={tier} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-slate-200 uppercase">{tier}</h4>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-300">{JSON.stringify(value, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

export function ModelDetail({ model }: ModelDetailProps) {
  return (
    <div className="space-y-8">
      <Card title={model.model} description={model.description} actions={<Badge color="primary">{model.vendor.name}</Badge>}>
        <div className="mt-4 space-y-6 text-sm text-slate-300">
          {model.model_url && (
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-400">Documentation</span>
              <a href={model.model_url} target="_blank" rel="noreferrer" className="block text-primary">
                {model.model_url}
              </a>
            </div>
          )}
          {model.model_capability && model.model_capability.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {model.model_capability.map((capability) => (
                <Badge key={capability}>{capability}</Badge>
              ))}
            </div>
          )}
          {model.license && model.license.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {model.license.map((license) => (
                <Badge key={license} color="success">
                  {license}
                </Badge>
              ))}
            </div>
          )}
          {model.note && <p className="text-sm text-slate-400">{model.note}</p>}
        </div>
      </Card>
      <Card title="Pricing" description="Raw pricing data across tiers and token types.">
        {renderPricing(model.price_data)}
      </Card>
    </div>
  );
}
