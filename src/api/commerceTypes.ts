export type MarketplaceFilter = "all" | "bestprice" | "skroutz" | "both" | "none";

export type PriceMonitoringSource = "skroutz" | "bestprice";

export type IgnoredFilter = "exclude" | "include";

export interface CatalogProduct {
  catalog_product_id?: number | string | null;
  model: string;
  mpn?: string | null;
  name?: string | null;
  category?: string | null;
  raw_category?: string | null;
  family?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
  category_levels?: string[] | null;
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

export type SourceUrlStatus = "active" | "disabled" | "broken" | "redirected" | "needs_review";

export type SourceUrlType = "manual" | "imported" | "discovered";

export interface SourceUrl {
  id?: number | string | null;
  source_url_id?: number | string | null;
  catalog_product_id?: number | string | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  manufacturer?: string | null;
  source_name?: string | null;
  source_domain?: string | null;
  url: string;
  url_normalized?: string | null;
  status: SourceUrlStatus | string;
  url_type: SourceUrlType | string;
  trust_level?: string | null;
  added_by?: string | null;
  notes?: string | null;
  last_seen_at?: string | null;
  last_success_at?: string | null;
  last_failed_at?: string | null;
  failure_count?: number | null;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface SourceUrlCreateBody {
  url: string;
  source_name?: string | null;
  url_type?: SourceUrlType | string | null;
  trust_level?: string | null;
  added_by?: string | null;
  notes?: string | null;
}

export interface SourceUrlUpdateBody {
  url?: string | null;
  source_name?: string | null;
  status?: SourceUrlStatus | string | null;
  trust_level?: string | null;
  notes?: string | null;
}

export interface SourceUrlValidationResponse {
  item: SourceUrl | null;
  validation: {
    status?: string | null;
    message?: string | null;
    http_status_code?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SourceUrlListResponse {
  items: SourceUrl[];
  count?: number;
  [key: string]: unknown;
}

export interface SourceUrlSummaryResponse {
  total_count?: number;
  active_count?: number;
  needs_review_count?: number;
  broken_count?: number;
  disabled_count?: number;
  redirected_count?: number;
  manual_count?: number;
  imported_count?: number;
  discovered_count?: number;
  products_with_urls_count?: number;
  products_without_urls_count?: number;
  coverage_percent?: number | null;
  by_status?: Record<string, number>;
  by_type?: Record<string, number>;
  by_source?: Record<string, number>;
  [key: string]: unknown;
}

export interface SourceUrlImportRequest {
  catalog_source?: string | null;
  include_observations?: boolean;
  include_artifacts?: boolean;
  include_legacy_runs?: boolean;
  legacy_runs_dir?: string | null;
  limit?: number | null;
  report_item_limit?: number | null;
  [key: string]: unknown;
}

export interface SourceUrlImportSummary {
  candidates_found: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  active_count: number;
  needs_review_count: number;
  invalid_url_count: number;
  duplicate_count: number;
  unresolved_identity_count: number;
  ambiguous_identity_count: number;
  would_import_count?: number;
  would_update_count?: number;
  [key: string]: unknown;
}

export interface SourceUrlImportCandidateReport {
  action?: string | null;
  status?: string | null;
  source_name?: string | null;
  source_domain?: string | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  url?: string | null;
  url_normalized?: string | null;
  evidence_source?: string | null;
  evidence_detail?: string | null;
  reason?: string | null;
  confidence?: string | null;
  catalog_product_id?: number | string | null;
  source_url_id?: number | string | null;
  [key: string]: unknown;
}

export interface SourceUrlImportResponse extends SourceUrlImportSummary {
  apply: boolean;
  summary: SourceUrlImportSummary;
  sources_processed: string[];
  warnings: string[];
  skipped_reasons: Record<string, number>;
  changed_source_urls: unknown[];
  source_stats: Record<string, Record<string, number>>;
  candidate_evidence: unknown[];
  report_items: SourceUrlImportCandidateReport[];
  truncated?: boolean;
  report_truncated?: boolean;
  [key: string]: unknown;
}

export interface SourceUrlImportOptionsResponse {
  catalog_sources: string[];
  legacy_runs_dirs: string[];
  default_catalog_source?: string | null;
  [key: string]: unknown;
}

export interface CatalogProductsResponse {
  items: CatalogProduct[];
  page: number;
  page_size: number;
  total: number;
  filtered_total: number;
  warning?: string | null;
}

export interface CatalogProductsParams {
  q?: string | null;
  category?: string | null;
  family?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
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

export interface CatalogCategoryOption {
  category: string;
  count?: number | null;
}

export interface CatalogSubCategoryNode {
  sub_category: string;
  count?: number | null;
  raw_categories?: string[] | null;
}

export interface CatalogCategoryNode {
  category_name: string;
  count?: number | null;
  sub_categories?: CatalogSubCategoryNode[] | null;
}

export interface CatalogFamilyNode {
  family: string;
  count?: number | null;
  categories?: CatalogCategoryNode[] | null;
}

export interface CatalogCategoryHierarchyResponse {
  items: CatalogFamilyNode[];
}

export interface CatalogBrandOption {
  manufacturer: string;
  count?: number | null;
}

export interface PriceMonitoringSelectionFilters {
  q: string | null;
  category?: string | null;
  family?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
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
  raw_category?: string | null;
  family?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
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

export type PriceMonitoringAction = "match_price" | "undercut" | "ignore";

export interface PriceMonitoringRun {
  run_id?: string | number | null;
  id?: string | number | null;
  status?: string | null;
  source?: PriceMonitoringSource | string | null;
  output_dir?: string | null;
  input_csv_path?: string | null;
  selection_summary_path?: string | null;
  selected_count?: number;
  skipped_count?: number;
  skipped_by_reason?: Record<string, number>;
  created_at?: string | null;
  updated_at?: string | null;
  latest_fetch?: FetchPriceMonitoringResult | null;
  [key: string]: unknown;
}

export interface FetchPriceMonitoringBody {
  source: PriceMonitoringSource | null;
  catalog_url: string | null;
}

export interface FetchPriceMonitoringResult {
  run_id?: string | number | null;
  execution_id?: string | number | null;
  status?: "queued" | "running" | "succeeded" | "failed" | "killed" | "cancelled" | string | null;
  source?: PriceMonitoringSource | string | null;
  catalog_url?: string | null;
  queued_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  killed_at?: string | null;
  cancel_reason?: string | null;
  killed_reason?: string | null;
  termination_mode?: string | null;
  terminate_sent_at?: string | null;
  kill_sent_at?: string | null;
  exit_code?: number | null;
  parent_process_id?: number | null;
  process_id?: number | null;
  process_group_id?: number | null;
  command?: string[] | null;
  artifacts_are_diagnostic?: boolean | null;
  artifact_warning?: string | null;
  execution_type?: string | null;
  queue_position?: number | null;
  stale?: boolean | null;
  input_csv_path?: ArtifactPayload | string | null;
  enriched_csv_path?: ArtifactPayload | string | null;
  fetch_summary_path?: ArtifactPayload | string | null;
  fetch_result_path?: ArtifactPayload | string | null;
  execution_path?: ArtifactPayload | string | null;
  log_path?: ArtifactPayload | string | null;
  warnings?: string[];
  error?: string | null;
  observation_count?: number;
  replaced_observation_count?: number;
  catalog_snapshot_count?: number | null;
  matched_observation_count?: number;
  unmatched_observation_count?: number;
  was_refetch?: boolean;
  fetch_attempt?: number;
  persistence_status?: "not_configured" | "persisted" | "failed" | "unknown" | string | null;
  persistence_warnings?: string[];
  alert_evaluation_status?: string | null;
  alert_event_count?: number;
  alert_duplicate_count?: number;
  alert_warnings?: string[];
  artifacts?: ArtifactItem[];
  [key: string]: unknown;
}

export interface PriceMonitoringFetchLogsResponse {
  run_id?: string | number | null;
  execution_id?: string | number | null;
  lines: string[];
}

export interface CancelPriceMonitoringFetchBody {
  reason?: string | null;
}

export interface PriceMonitoringDbStatus {
  configured: boolean;
  reachable: boolean;
  price_monitoring_requires_database?: boolean | null;
  ready_for_price_monitoring?: boolean | null;
  blocking_reasons?: string[] | null;
  non_db_workflows_available?: boolean | null;
  required_for?: string[] | null;
  dialect?: string | null;
  error?: string | null;
  required_tables_present?: boolean | null;
  alembic_up_to_date?: boolean | null;
  alembic_current_revision?: string | null;
  alembic_head_revision?: string | null;
  setup_hints?: string[] | null;
  [key: string]: unknown;
}

export type PriceObservationMatchStatus = "matched" | "unmatched";

export interface PriceObservation {
  id?: number | string;
  product_id?: number | string | null;
  run_id?: string | number | null;
  catalog_source?: string | null;
  source?: string | null;
  model?: string | null;
  mpn?: string | null;
  product_name?: string | null;
  competitor_name?: string | null;
  competitor_price?: number | string | null;
  own_price?: number | string | null;
  price_delta?: number | string | null;
  price_delta_percent?: number | string | null;
  currency?: string | null;
  availability?: string | null;
  product_url?: string | null;
  matched_by?: "model" | "mpn" | string | null;
  match_status?: PriceObservationMatchStatus | string | null;
  is_matched?: boolean | null;
  observed_at?: string | null;
  created_at?: string | null;
  raw_observation?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PriceObservationsParams {
  run_id?: string | null;
  source?: string | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  product_id?: string | number | null;
  match_status?: PriceObservationMatchStatus | "all" | null;
  include_unmatched?: boolean;
  limit?: number;
  offset?: number;
}

export interface PriceObservationsResponse {
  items: PriceObservation[];
  limit?: number;
  offset?: number;
  count: number;
}

export interface RunPriceObservationsResponse {
  run_id?: string | number | null;
  items: PriceObservation[];
  count: number;
  matched_count?: number;
  unmatched_count?: number;
}

export interface CatalogSnapshot {
  id?: number | string;
  product_id?: number | string | null;
  run_id?: string | number | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  name?: string | null;
  manufacturer?: string | null;
  family?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
  marketplace?: string | null;
  own_price?: number | string | null;
  currency?: string | null;
  raw_catalog_row?: Record<string, unknown> | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface CatalogSnapshotResponse {
  run_id?: string | number | null;
  items: CatalogSnapshot[];
  count: number;
}

export interface PriceHistoryResponse {
  product_id?: string | number | null;
  model?: string | null;
  catalog_source?: string | null;
  items: PriceObservation[];
  count: number;
}

export type AlertRuleType = "competitor_below_own_price";

export type AlertEventStatus = "open" | "acknowledged" | "resolved";

export interface AlertRule {
  id?: number | string;
  name?: string | null;
  rule_type?: AlertRuleType | string;
  product_id?: number | string | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  threshold_amount?: number | string | null;
  threshold_percent?: number | string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AlertEvent {
  id?: number | string;
  alert_rule_id?: number | string | null;
  monitoring_run_id?: number | string | null;
  price_observation_id?: number | string | null;
  product_id?: number | string | null;
  run_id?: string | number | null;
  catalog_source?: string | null;
  model?: string | null;
  mpn?: string | null;
  source?: string | null;
  competitor_name?: string | null;
  competitor_price?: number | string | null;
  own_price?: number | string | null;
  price_delta?: number | string | null;
  price_delta_percent?: number | string | null;
  severity?: string | null;
  status?: AlertEventStatus | string | null;
  message?: string | null;
  dedupe_key?: string | null;
  triggered_at?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  raw_context?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AlertRulesResponse {
  items: AlertRule[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface AlertEventsResponse {
  items: AlertEvent[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface CreateAlertRuleBody {
  name: string | null;
  rule_type: "competitor_below_own_price";
  product_id: number | null;
  catalog_source: string | null;
  model: string | null;
  mpn: string | null;
  threshold_amount: number | string | null;
  threshold_percent: number | string | null;
  active: boolean;
}

export type UpdateAlertRuleBody = Partial<CreateAlertRuleBody>;

export interface EvaluateAlertsResponse {
  run_id?: string | number | null;
  status?: string | null;
  evaluated_rule_count?: number;
  evaluated_observation_count?: number;
  created_event_count?: number;
  duplicate_event_count?: number;
  skipped_count?: number;
  warnings?: string[];
}

export interface PriceMonitoringReviewParams {
  enriched_csv_path?: string | null;
}

export interface PriceMonitoringReviewItem {
  model: string;
  mpn?: string | null;
  name?: string | null;
  current_price?: number | null;
  source?: PriceMonitoringSource | string | null;
  competitor_price?: number | null;
  competitor_store?: string | null;
  competitor_url?: string | null;
  price_delta?: number | null;
  price_delta_percent?: number | null;
  recommended_action?: PriceMonitoringAction | "" | string | null;
  selected_action?: PriceMonitoringAction | "" | string | null;
  undercut_amount?: number | null;
  target_price?: number | null;
  status?: string | null;
  warnings?: string[];
  [key: string]: unknown;
}

export interface PriceMonitoringReviewResponse {
  run_id?: string | number | null;
  items: PriceMonitoringReviewItem[];
  summary?: Record<string, number>;
  review_csv_path?: ArtifactPayload | string | null;
  enriched_csv_path?: ArtifactPayload | string | null;
  [key: string]: unknown;
}

export interface PriceMonitoringReviewAction {
  model: string;
  selected_action: PriceMonitoringAction;
  undercut_amount?: number | null;
  reason?: string;
}

export interface ApplyPriceMonitoringReviewActionsBody {
  enriched_csv_path: string | null;
  actions: PriceMonitoringReviewAction[];
}

export interface ApplyPriceMonitoringReviewActionsResult {
  status?: string | null;
  review_csv_path?: ArtifactPayload | string | null;
  review_actions_path?: ArtifactPayload | string | null;
  summary?: {
    actions_count?: number;
    exportable_count?: number;
    ignored_count?: number;
    not_exportable_count?: number;
    [key: string]: number | undefined;
  };
  [key: string]: unknown;
}

export interface ExportPriceMonitoringPriceUpdateBody {
  review_csv_path: string | null;
  output_path: string | null;
}

export interface ExportPriceMonitoringPriceUpdateResult {
  status?: string | null;
  output_path?: ArtifactPayload | string | null;
  rows_exported?: number;
  columns?: string[];
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
  extension?: string | null;
  size_bytes?: number | null;
  modified_at?: string | null;
  download_url?: string | null;
  read_url?: string | null;
  is_allowed?: boolean | null;
  can_read?: boolean | null;
  can_download?: boolean | null;
  warning?: string | null;
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

export interface ArtifactRoot {
  path: string;
  exists?: boolean | null;
  name?: string | null;
  source?: string | null;
  is_default?: boolean | null;
  is_configured?: boolean | null;
}

export interface ArtifactPayload {
  name: string;
  path: string;
  extension?: string | null;
  size_bytes?: number | null;
  modified_at?: string | null;
  download_url?: string | null;
  read_url?: string | null;
  is_allowed: boolean;
  can_read: boolean;
  can_download: boolean;
  warning?: string | null;
  [key: string]: unknown;
}

export type ArtifactItem = ArtifactPayload;

export interface ArtifactListResponse {
  items: ArtifactItem[];
  root?: string | null;
  run_id?: string | number | null;
}

export interface ArtifactReadResponse {
  path: string;
  content: string;
  truncated?: boolean | null;
  size_bytes?: number | null;
  encoding?: string | null;
  [key: string]: unknown;
}

export interface PathRootsEnv {
  PRICEFETCHER_ARTIFACT_ROOTS?: string | null;
  PRICEFETCHER_FILE_ROOTS?: string | null;
  [key: string]: string | null | undefined;
}

export interface PathRootsResponse {
  artifact_roots: ArtifactRoot[];
  file_roots: ArtifactRoot[];
  output_roots: ArtifactRoot[];
  env: PathRootsEnv;
  path_separator?: string | null;
  platform?: string | null;
}
