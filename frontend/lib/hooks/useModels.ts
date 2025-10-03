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
  categories: string[];
}

interface ModelFilters {
  search?: string;
  vendorName?: string;
  priceModel?: string;
  priceCurrency?: string;
  capability?: string;
  license?: string;
  categories?: string | string[];
  page?: number;
  sort?: string;
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
      if (filters.categories) {
        const value = Array.isArray(filters.categories)
          ? filters.categories.filter(Boolean).join(",")
          : filters.categories;
        if (value) {
          params.set("categories", value);
        }
      }
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.page) params.set("page", String(filters.page));
      return client.get<ListResponse<any>>(`/api/public/models?${params.toString()}`);
    }
  });
}

export function useModelsByIds(modelIds: number[]) {
  const token = useAuthStore((state) => state.token);
  const client = new ApiClient({ getToken: () => token });

  return useQuery({
    queryKey: ["models-by-ids", [...modelIds].sort(), token],
    queryFn: async () => {
      const uniqueIds = Array.from(new Set(modelIds.filter((id) => Number.isInteger(id))));
      if (!uniqueIds.length) {
        return [] as any[];
      }
      const responses = await Promise.all(uniqueIds.map((id) => client.get<any>(`/api/public/models/${id}`)));
      const lookup = new Map<number, any>();
      uniqueIds.forEach((id, index) => {
        lookup.set(id, responses[index]);
      });
      return modelIds
        .map((id) => lookup.get(id))
        .filter((model): model is any => Boolean(model));
    },
    enabled: modelIds.length > 0
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

  const normalizeStringArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
      } catch (error) {
        // ignore parse errors and fall back to raw string
      }
      return value.trim() ? [value.trim()] : [];
    }
    return [];
  };

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
      const categorySet = new Set<string>();

      modelsItems.forEach((model) => {
        const capabilityCandidates = [
          model?.model_capability,
          (model as Record<string, unknown> | null | undefined)?.modelCapability,
          (model as Record<string, unknown> | null | undefined)?.capabilities,
          (model as Record<string, unknown> | null | undefined)?.capability
        ];
        capabilityCandidates.forEach((candidate) => {
          normalizeStringArray(candidate).forEach((cap) => capabilitySet.add(cap));
        });

        const licenseCandidates = [
          model?.license,
          (model as Record<string, unknown> | null | undefined)?.licenses
        ];
        licenseCandidates.forEach((candidate) => {
          normalizeStringArray(candidate).forEach((license) => licenseSet.add(license));
        });

        const categoryCandidates = [
          model?.categories,
          (model as Record<string, unknown> | null | undefined)?.categories
        ];
        categoryCandidates.forEach((candidate) => {
          normalizeStringArray(candidate).forEach((category) => categorySet.add(category));
        });
      });

      return {
        vendors,
        capabilities: Array.from(capabilitySet).sort((a, b) => a.localeCompare(b)),
        licenses: Array.from(licenseSet).sort((a, b) => a.localeCompare(b)),
        categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b))
      };
    },
    staleTime: 5 * 60 * 1000
  });
}
