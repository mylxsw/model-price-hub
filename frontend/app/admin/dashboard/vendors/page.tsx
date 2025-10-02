"use client";

import { useState } from "react";

import { VendorForm, VendorInput } from "../../../../components/admin/VendorForm";
import { Card } from "../../../../components/ui/Card";
import { Table } from "../../../../components/ui/Table";
import { Button } from "../../../../components/ui/Button";
import { ApiClient } from "../../../../lib/apiClient";
import { useAdminVendors } from "../../../../lib/hooks/useVendors";
import { useAuthStore } from "../../../../lib/hooks/useAuth";

const client = new ApiClient({
  getToken: () => useAuthStore.getState().token ?? null
});

export default function AdminVendorsPage() {
  const { data, refetch, isFetching } = useAdminVendors();
  const [editingVendor, setEditingVendor] = useState<VendorInput | null>(null);

  const handleSubmit = async (values: VendorInput) => {
    if (values.id) {
      await client.put(`/api/admin/vendors/${values.id}`, values);
    } else {
      await client.post("/api/admin/vendors", values);
    }
    setEditingVendor(null);
    await refetch();
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor({
      id: vendor.id,
      name: vendor.name,
      description: vendor.description,
      vendor_image: vendor.vendor_image,
      url: vendor.url,
      api_url: vendor.api_url,
      note: vendor.note,
      status: vendor.status
    });
  };

  const handleDelete = async (vendorId: number) => {
    await client.delete(`/api/admin/vendors/${vendorId}`);
    await refetch();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Vendor directory"
        description="Manage supplier information."
        actions={<span className="text-xs text-slate-500">{isFetching ? "Refreshing..." : `${data?.total ?? 0} vendors`}</span>}
      >
        <Table
          data={data?.items ?? []}
          columns={[
            {
              header: "Name",
              accessor: (vendor) => (
                <div>
                  <p className="font-medium text-slate-100">{vendor.name}</p>
                  {vendor.url && (
                    <a href={vendor.url} className="text-xs text-primary" target="_blank" rel="noreferrer">
                      {vendor.url}
                    </a>
                  )}
                </div>
              )
            },
            {
              header: "Status",
              accessor: (vendor) => <span className="text-xs uppercase text-slate-400">{vendor.status}</span>
            },
            {
              header: "Actions",
              accessor: (vendor) => (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(vendor)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(vendor.id)}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>
      <VendorForm
        initialValues={editingVendor ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={editingVendor ? "Update vendor" : "Create vendor"}
      />
    </div>
  );
}
