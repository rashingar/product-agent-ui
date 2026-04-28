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

export interface FileRoot {
  path: string;
  exists: boolean;
}

export interface FileRootsResponse {
  roots: FileRoot[];
}

export type FileListItemType = "file" | "directory";

export interface FileListItem {
  name: string;
  path: string;
  type: FileListItemType;
  extension?: string | null;
  size_bytes?: number | null;
  modified_at?: string | null;
}

export interface FileListParams {
  root: string;
  relative_path?: string | null;
}

export interface FileListResponse {
  root: string;
  relative_path: string;
  items: FileListItem[];
}

export interface ReadCsvFileBody {
  path: string;
  delimiter: string | null;
  max_rows: number;
}

export type CsvRow = Record<string, string>;

export interface ReadCsvFileResponse {
  path: string;
  filename: string;
  delimiter: string;
  encoding?: string | null;
  columns: string[];
  rows: CsvRow[];
  returned_rows: number;
  total_rows: number;
  size_bytes?: number | null;
  modified_at?: string | null;
}

export interface SaveCsvFileBody {
  path: string;
  columns: string[];
  rows: CsvRow[];
  delimiter: string;
}

export interface SaveCsvCopyBody {
  source_path: string;
  target_path: string;
  columns: string[];
  rows: CsvRow[];
  delimiter: string;
}

export interface SaveCsvResponse {
  path?: string;
  target_path?: string;
  source_path?: string;
  rows?: number;
  row_count?: number;
  columns?: string[];
  size_bytes?: number | null;
  modified_at?: string | null;
  [key: string]: unknown;
}

export interface BridgeRunBody {
  opencart_export_path: string;
  stock_csv_path: string | null;
  output_dir: string | null;
}

export interface BridgeArtifact {
  name?: string | null;
  path?: string | null;
  [key: string]: unknown;
}

export interface BridgeRunResponse {
  run_id?: string | number | null;
  status?: string | null;
  stock_csv_path?: string | null;
  opencart_export_path?: string | null;
  output_dir?: string | null;
  artifacts?: BridgeArtifact[];
  summary?: Record<string, number>;
  [key: string]: unknown;
}
