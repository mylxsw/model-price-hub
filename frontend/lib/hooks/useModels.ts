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

interface ModelFilterMetadata {
  vendors: string[];
  capabilities: string[];
  licenses: string[];
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

export function useAdminModel(modelId?: number) {
  const token = useAuthStore((state) => state.token);
  const client = new ApiClient({ getToken: () => token });

  return useQuery({
    queryKey: ["admin-model", modelId, token],
    queryFn: () => client.get<any>(`/api/admin/models/${modelId}`),
    enabled: Boolean(token && modelId)
  });
}

const FILTER_META_PAGE_SIZE = 100;

export function useModelFilterOptions() {
  const client = new ApiClient();

  return useQuery<ModelFilterMetadata>({
    queryKey: ["model-filter-options"],
    queryFn: async () => {
      const fetchAll = async (path: string) => {
        const items: any[] = [];
        let page = 1;
        while (true) {
          const response = await client.get<ListResponse<any>>(
            `${path}?page=${page}&page_size=${FILTER_META_PAGE_SIZE}`
          );
          items.push(...(response.items ?? []));
          if ((response.items?.length ?? 0) < FILTER_META_PAGE_SIZE || items.length >= (response.total ?? 0)) {
            break;
          }
          page += 1;
        }
        return items;
      };

      const [vendorsItems, modelsItems] = await Promise.all([
        fetchAll("/api/public/vendors"),
        fetchAll("/api/public/models")
      ]);

      const vendors = Array.from(
        new Set(
          vendorsItems
            .map((vendor) => vendor?.name)
            .filter((name): name is string => Boolean(name))
        )
      ).sort((a, b) => a.localeCompare(b));

      const capabilitySet = new Set<string>();
      const licenseSet = new Set<string>();

      modelsItems.forEach((model) => {
        const capabilities = Array.isArray(model?.model_capability)
          ? model.model_capability
          : typeof model?.model_capability === "string"
            ? [model.model_capability]
            : [];
        capabilities
          .filter((cap): cap is string => Boolean(cap))
          .forEach((cap) => capabilitySet.add(cap));

        const licenses = Array.isArray(model?.license)
          ? model.license
          : typeof model?.license === "string"
            ? [model.license]
            : [];
        licenses
          .filter((license): license is string => Boolean(license))
          .forEach((license) => licenseSet.add(license));
      });

      return {
        vendors,
        capabilities: Array.from(capabilitySet).sort((a, b) => a.localeCompare(b)),
        licenses: Array.from(licenseSet).sort((a, b) => a.localeCompare(b))
      };
    },
    staleTime: 5 * 60 * 1000
  });
}
