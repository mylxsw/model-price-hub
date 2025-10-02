"use client";

import { useRouter } from "next/navigation";

import { VendorForm, VendorInput } from "../../../../../components/admin/VendorForm";
import { Button } from "../../../../../components/ui/Button";
import { ApiClient } from "../../../../../lib/apiClient";
import { useAuthStore } from "../../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function CreateVendorPage() {
  const router = useRouter();

  const handleSubmit = async (values: VendorInput) => {
    await client.post("/api/admin/vendors", values);
    router.push("/admin/dashboard/vendors");
    router.refresh();
  };

  return (
    <div className="space-y-6 px-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Create vendor</h1>
          <p className="text-sm text-slate-400">Add a new supplier to the catalog.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/dashboard/vendors")}>Back to vendors</Button>
      </div>
      <VendorForm onSubmit={handleSubmit} submitLabel="Create vendor" />
    </div>
  );
}
