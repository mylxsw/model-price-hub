"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import { VendorForm, VendorInput } from "../../../../../components/admin/VendorForm";
import { Button } from "../../../../../components/ui/Button";
import { ApiClient } from "../../../../../lib/apiClient";
import { useAuthStore } from "../../../../../lib/hooks/useAuth";
import { useAdminVendor } from "../../../../../lib/hooks/useVendors";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function EditVendorPage() {
  const params = useParams<{ vendorId: string }>();
  const router = useRouter();
  const vendorId = Number(params.vendorId);
  const { data, isLoading, error } = useAdminVendor(Number.isFinite(vendorId) ? vendorId : undefined);

  const initialValues = useMemo<VendorInput | undefined>(() => {
    if (!data) return undefined;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      vendor_image: data.vendor_image ?? data.vendorImage ?? "",
      url: data.url,
      api_url: data.api_url,
      note: data.note,
      status: data.status
    };
  }, [data]);

  const handleSubmit = async (values: VendorInput) => {
    await client.put(`/api/admin/vendors/${vendorId}`, values);
    router.push("/admin/dashboard/vendors");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit vendor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update supplier details and status.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/dashboard/vendors")}>Back to vendors</Button>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading vendor...</p>}
      {error && <p className="text-sm text-red-400">Failed to load vendor details.</p>}
      {!isLoading && !error && initialValues && (
        <VendorForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Save changes" />
      )}
      {!isLoading && !error && !initialValues && (
        <p className="text-sm text-slate-400">Vendor not found.</p>
      )}
    </div>
  );
}
