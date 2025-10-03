"use client";

import { useRouter } from "next/navigation";

import { VendorForm, VendorInput } from "../../../../../components/admin/VendorForm";
import { Button } from "../../../../../components/ui/Button";
import { useToast } from "../../../../../components/ui/ToastProvider";
import { ApiClient } from "../../../../../lib/apiClient";
import { useAuthStore } from "../../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function CreateVendorPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (values: VendorInput) => {
    try {
      await client.post("/api/admin/vendors", values);
      showToast({
        variant: "success",
        title: "Vendor created",
        description: values.name ? `${values.name} has been added.` : "Vendor saved successfully."
      });
      router.push("/admin/dashboard/vendors");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create vendor";
      showToast({ variant: "error", title: "Vendor creation failed", description: message });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create vendor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add a new supplier to the catalog.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/dashboard/vendors")}>Back to vendors</Button>
      </div>
      <VendorForm onSubmit={handleSubmit} submitLabel="Create vendor" />
    </div>
  );
}
