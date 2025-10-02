"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleDelete = async (vendorId: number) => {
    await client.delete(`/api/admin/vendors/${vendorId}`);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Vendors</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage supplier information and endpoints.</p>
        </div>
        <Button onClick={() => router.push("/admin/dashboard/vendors/new")}>Add vendor</Button>
      </div>
      <Card
        title="Vendor directory"
        description="Overview of all vendors accessible to the catalog."
        actions={<span className="text-xs text-slate-500">{isFetching ? "Refreshing..." : `${data?.total ?? 0} vendors`}</span>}
      >
        <Table
          data={data?.items ?? []}
          columns={[
            {
              header: "Name",
              accessor: (vendor) => (
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{vendor.name}</p>
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
              accessor: (vendor) => (
                <span className="text-xs uppercase text-slate-500 dark:text-slate-400">{vendor.status}</span>
              )
            },
            {
              header: "Actions",
              accessor: (vendor) => (
                <div className="flex items-center gap-3">
                  <Button variant="success" size="sm" onClick={() => router.push(`/admin/dashboard/vendors/${vendor.id}`)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(vendor.id)}>
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
