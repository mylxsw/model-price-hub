"use client";

import Link from "next/link";

import { Card } from "../../../components/ui/Card";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Manage models" description="Add, update, and remove model pricing entries.">
        <Link href="/admin/dashboard/models" className="text-sm text-primary">
          Open models dashboard →
        </Link>
      </Card>
      <Card title="Manage vendors" description="Maintain vendor information and API endpoints.">
        <Link href="/admin/dashboard/vendors" className="text-sm text-primary">
          Open vendors dashboard →
        </Link>
      </Card>
    </div>
  );
}
