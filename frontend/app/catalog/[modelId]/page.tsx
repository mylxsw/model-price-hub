import { notFound } from "next/navigation";

import { ModelDetail } from "../../../components/catalog/ModelDetail";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchModel(modelId: string) {
  const response = await fetch(`${baseUrl}/api/public/models/${modelId}`, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export default async function ModelDetailPage({ params }: { params: { modelId: string } }) {
  const model = await fetchModel(params.modelId);
  if (!model) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <ModelDetail model={model} />
      </div>
    </div>
  );
}
