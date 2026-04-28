export type MarketplaceFilter = "all" | "bestprice" | "skroutz" | "both" | "none";

export type PriceMonitoringSource = "skroutz" | "bestprice";

export type IgnoredFilter = "exclude" | "include";

export interface CatalogProduct {
  model: string;
  mpn?: string | null;
  name?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  price?: number | null;
  quantity?: number | null;
  status?: number | null;
  bestprice_status?: number | null;
  skroutz_status?: number | null;
  is_atomic_model?: boolean | null;
  automation_eligible?: boolean | null;
  ignored?: boolean | null;
  warnings?: string[] | null;
  [key: string]: unknown;
}

export interface CatalogProductsResponse {
  items: CatalogProduct[];
  page: number;
  page_size: number;
  total: number;
  filtered_total: number;
}

export interface CatalogProductsParams {
  q?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  marketplace?: MarketplaceFilter | null;
  page?: number;
  page_size?: number;
  atomic_only?: boolean;
  ignored?: IgnoredFilter;
  automation_eligible_only?: boolean;
}

export interface CatalogSummary {
  total_products?: number;
  total?: number;
  active_products?: number;
  active?: number;
  atomic_products?: number;
  atomic?: number;
  composite_products?: number;
  composite_invalid_models?: number;
  non_atomic_products?: number;
  bestprice_products?: number;
  bestprice?: number;
  skroutz_products?: number;
  skroutz?: number;
  missing_mpn?: number;
  missing_mpn_products?: number;
  [key: string]: unknown;
}

export interface PriceMonitoringSelectionFilters {
  q: string | null;
  category: string | null;
  manufacturer: string | null;
  marketplace: Exclude<MarketplaceFilter, "all"> | null;
  has_mpn: boolean;
  atomic_only: boolean;
  automation_eligible_only: boolean;
}

export interface PriceMonitoringSelectionBody {
  source: PriceMonitoringSource;
  filters: PriceMonitoringSelectionFilters;
  selected_models: string[];
  excluded_models: string[];
  include_ignored: boolean;
  dry_run: boolean;
}

export interface PriceMonitoringSelectionItem {
  model?: string;
  name?: string;
  mpn?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  [key: string]: unknown;
}

export interface PriceMonitoringSelectionResult {
  run_id?: string | number | null;
  status?: string | null;
  source?: PriceMonitoringSource | string | null;
  output_dir?: string | null;
  input_csv_path?: string | null;
  selection_summary_path?: string | null;
  selected_count?: number;
  skipped_count?: number;
  skipped_by_reason?: Record<string, number>;
  selected_items?: PriceMonitoringSelectionItem[];
  selected?: PriceMonitoringSelectionItem[];
  skipped_reasons?: Record<string, unknown>;
  skipped_items?: PriceMonitoringSelectionItem[];
  [key: string]: unknown;
}
