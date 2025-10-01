"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiClient } from "../apiClient";
import { useAuthStore } from "./useAuth";

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export function usePublicVendors() {
  const client = new ApiClient();
  return useQuery({
    queryKey: ["public-vendors"],
    queryFn: () => client.get<ListResponse<any>>("/api/public/vendors")
  });
}

export function useAdminVendors() {
  const token = useAuthStore((state) => state.token);
  const client = new ApiClient({ getToken: () => token });

  return useQuery({
    queryKey: ["admin-vendors", token],
    queryFn: () => client.get<ListResponse<any>>("/api/admin/vendors"),
    enabled: Boolean(token)
  });
}
