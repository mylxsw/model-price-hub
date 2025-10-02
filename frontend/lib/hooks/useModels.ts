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

interface ModelFilters {
  search?: string;
  vendorName?: string;
  priceModel?: string;
  priceCurrency?: string;
  capability?: string;
  license?: string;
  page?: number;
}

export function useModels(filters: ModelFilters = {}) {
  const token = useAuthStore((state) => state.token);
  const client = new ApiClient({ getToken: () => token });

  return useQuery({
    queryKey: ["models", filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.vendorName) params.set("vendor_name", filters.vendorName);
      if (filters.priceModel) params.set("price_model", filters.priceModel);
      if (filters.priceCurrency) params.set("price_currency", filters.priceCurrency);
      if (filters.capability) params.set("capabilities", filters.capability);
      if (filters.license) params.set("license", filters.license);
      if (filters.page) params.set("page", String(filters.page));
      return client.get<ListResponse<any>>(`/api/public/models?${params.toString()}`);
    }
  });
}

export function useAdminModels(filters: Record<string, string | number | undefined> = {}) {
  const token = useAuthStore((state) => state.token);
  const client = new ApiClient({ getToken: () => token });

  return useQuery({
    queryKey: ["admin-models", filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      });
      return client.get<ListResponse<any>>(`/api/admin/models?${params.toString()}`);
    },
    enabled: Boolean(token)
  });
}
