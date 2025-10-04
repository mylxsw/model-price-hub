import { ModelFilterValues } from "../components/catalog/ModelFilterPanel";

export const defaultModelFilters: ModelFilterValues = {
  search: "",
  vendorName: "",
  priceModel: "",
  priceCurrency: "",
  capability: "",
  license: "",
  category: ""
};

export const catalogSortOptions: { label: string; value: string }[] = [
  { label: "Created (newest)", value: "created_desc" },
  { label: "Created (oldest)", value: "created_asc" },
  { label: "Updated (newest)", value: "updated_desc" },
  { label: "Updated (oldest)", value: "updated_asc" },
  { label: "Release date (newest)", value: "release_desc" },
  { label: "Release date (oldest)", value: "release_asc" },
  { label: "Price (low to high)", value: "price_asc" },
  { label: "Price (high to low)", value: "price_desc" },
  { label: "Vendor (A-Z)", value: "vendor_asc" },
  { label: "Model name (A-Z)", value: "model_asc" },
  { label: "Model name (Z-A)", value: "model_desc" }
];

export const defaultCatalogSort = catalogSortOptions[0]?.value ?? "created_desc";

export function filtersAreEqual(a: ModelFilterValues, b: ModelFilterValues) {
  return (
    a.search === b.search &&
    a.vendorName === b.vendorName &&
    a.priceModel === b.priceModel &&
    a.priceCurrency === b.priceCurrency &&
    a.capability === b.capability &&
    a.license === b.license &&
    a.category === b.category
  );
}

export function parseCatalogSearchParams(params: URLSearchParams) {
  const filters: ModelFilterValues = {
    search: params.get("search") ?? "",
    vendorName: params.get("vendor_name") ?? "",
    priceModel: params.get("price_model") ?? "",
    priceCurrency: params.get("price_currency") ?? "",
    capability: params.get("capabilities") ?? "",
    license: params.get("license") ?? "",
    category: params.get("categories") ?? ""
  };

  const sort = params.get("sort") ?? defaultCatalogSort;
  const page = Number.parseInt(params.get("page") ?? "1", 10);

  return {
    filters,
    sort,
    page: Number.isNaN(page) || page < 1 ? 1 : page
  };
}

export function createCatalogSearchParams(
  filters: ModelFilterValues,
  sort: string,
  page: number
) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.vendorName) params.set("vendor_name", filters.vendorName);
  if (filters.priceModel) params.set("price_model", filters.priceModel);
  if (filters.priceCurrency) params.set("price_currency", filters.priceCurrency);
  if (filters.capability) params.set("capabilities", filters.capability);
  if (filters.license) params.set("license", filters.license);
  if (filters.category) params.set("categories", filters.category);
  if (sort && sort !== defaultCatalogSort) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params;
}
