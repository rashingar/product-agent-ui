import type { MockRequest, MockRoute } from "../mockFetch";

export const commerceHealth = {
  status: "ok",
  service: "price-fetcher",
  version: "test-fixture",
};

export const catalogSummary = {
  total_products: 3,
  active_products: 3,
  atomic_products: 2,
  composite_invalid_models: 1,
  bestprice_products: 2,
  skroutz_products: 2,
  missing_mpn: 1,
  manufacturer_count: 3,
};

export const catalogBrands = {
  items: [
    { manufacturer: "Midea", count: 1 },
    { manufacturer: "Inventor", count: 1 },
    { manufacturer: "ΓΕΡΜΑΝΟΣ", count: 1 },
  ],
  manufacturers: [
    { manufacturer: "Midea", count: 1 },
    { manufacturer: "Inventor", count: 1 },
    { manufacturer: "ΓΕΡΜΑΝΟΣ", count: 1 },
  ],
};

export const catalogCategoryHierarchy = {
  items: [
    {
      family: "Σπίτι",
      count: 2,
      categories: [
        {
          category_name: "Κλιματισμός",
          count: 2,
          sub_categories: [
            {
              sub_category: "Αφυγραντήρες",
              count: 2,
              raw_categories: ["Σπίτι > Κλιματισμός > Αφυγραντήρες"],
            },
          ],
        },
      ],
    },
    {
      family: "Τεχνολογία",
      count: 1,
      categories: [
        {
          category_name: "Περιφερειακά",
          count: 1,
          sub_categories: [{ sub_category: "Πληκτρολόγια", count: 1 }],
        },
      ],
    },
  ],
  families: [
    {
      family: "Σπίτι",
      count: 2,
      categories: [
        {
          category_name: "Κλιματισμός",
          count: 2,
          sub_categories: [
            {
              sub_category: "Αφυγραντήρες",
              count: 2,
              raw_categories: ["Σπίτι > Κλιματισμός > Αφυγραντήρες"],
            },
          ],
        },
      ],
    },
    {
      family: "Τεχνολογία",
      count: 1,
      categories: [
        {
          category_name: "Περιφερειακά",
          count: 1,
          sub_categories: [{ sub_category: "Πληκτρολόγια", count: 1 }],
        },
      ],
    },
  ],
};

export const catalogProducts = {
  items: [
    {
      catalog_product_id: 1,
      model: "005606",
      mpn: "MD-20L",
      name: "Midea Αφυγραντήρας 20L",
      manufacturer: "Midea",
      family: "Σπίτι",
      category_name: "Κλιματισμός",
      sub_category: "Αφυγραντήρες",
      raw_category: "Σπίτι > Κλιματισμός > Αφυγραντήρες",
      category_levels: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
      price: 199.9,
      quantity: 12,
      bestprice_status: 1,
      skroutz_status: 1,
      is_atomic_model: true,
      automation_eligible: true,
      ignored: false,
      warnings: [],
      status: 1,
    },
    {
      catalog_product_id: 2,
      model: "AB-123",
      mpn: null,
      name: "Σετ πληκτρολόγιο και ποντίκι",
      manufacturer: "ΓΕΡΜΑΝΟΣ",
      family: "Τεχνολογία",
      category_name: "Περιφερειακά",
      sub_category: "Πληκτρολόγια",
      raw_category: "Τεχνολογία > Περιφερειακά > Πληκτρολόγια",
      price: 39.9,
      quantity: 4,
      bestprice_status: 0,
      skroutz_status: 1,
      is_atomic_model: false,
      automation_eligible: false,
      ignored: false,
      warnings: ["Composite model"],
      status: 1,
    },
  ],
  page: 1,
  page_size: 100,
  total: 2,
  filtered_total: 2,
};

export const sourceUrlSummary = {
  source_url_count: 3,
  catalog_product_count: 2,
  products_with_active_source_urls: 1,
  products_without_active_source_urls: 1,
  by_url_type: {
    manual: 2,
    imported: 1,
    discovered: 0,
  },
  by_source_name: {
    skroutz: 1,
    bestprice: 1,
    public: 1,
  },
  total_count: 3,
  active_count: 1,
  needs_review_count: 1,
  broken_count: 1,
  disabled_count: 0,
  redirected_count: 0,
  manual_count: 2,
  imported_count: 1,
  discovered_count: 0,
  products_with_urls_count: 1,
  products_without_urls_count: 1,
  coverage_percent: 50,
  by_status: {
    active: 1,
    needs_review: 1,
    broken: 1,
    disabled: 0,
    redirected: 0,
  },
  by_type: {
    manual: 2,
    imported: 1,
    discovered: 0,
  },
  by_source: {
    skroutz: 1,
    bestprice: 1,
    public: 1,
  },
};

export const sourceUrlsForCatalogProduct = {
  items: [
    {
      id: 101,
      product_source_id: 1001,
      catalog_product_id: 1,
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      manufacturer: "Midea",
      source_name: "skroutz",
      source_domain: "skroutz.gr",
      url: "https://www.skroutz.gr/s/123/midea-md-20l.html",
      url_normalized: "https://www.skroutz.gr/s/123/midea-md-20l.html",
      status: "active",
      url_type: "manual",
      trust_level: "manual",
      added_by: "operator",
      notes: "Primary manual product URL.",
      last_seen_at: "2026-05-02T08:00:00Z",
      last_success_at: "2026-05-02T08:00:00Z",
      last_failed_at: null,
      failure_count: 0,
      last_error: null,
      capture_status: "success",
      last_capture_status: "success",
      last_capture_strategy: "scheduled-test",
      last_capture_at: "2026-05-02T08:05:00Z",
      last_capture_snapshot_id: 9001,
      source_capture_snapshot_id: 9001,
      full_snapshot_ref: {
        name: "source-capture-9001.json",
        path: "source-captures/9001/full-snapshot.json",
        is_allowed: true,
        can_read: true,
        can_download: true,
      },
      created_at: "2026-05-02T08:00:00Z",
      updated_at: "2026-05-02T08:00:00Z",
    },
    {
      id: 102,
      catalog_product_id: 1,
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      manufacturer: "Midea",
      source_name: "bestprice",
      source_domain: "bestprice.gr",
      url: "https://www.bestprice.gr/item/456/midea-md-20l.html",
      url_normalized: "https://www.bestprice.gr/item/456/midea-md-20l.html",
      status: "needs_review",
      url_type: "imported",
      trust_level: "medium",
      added_by: "source-url-import",
      notes: "Imported from enriched artifact; promote after review.",
      last_seen_at: "2026-05-02T07:40:00Z",
      last_success_at: null,
      last_failed_at: null,
      failure_count: 0,
      last_error: null,
      created_at: "2026-05-02T07:40:00Z",
      updated_at: "2026-05-02T07:40:00Z",
    },
  ],
  count: 2,
};

export const sourceUrlCoverage = {
  source: "skroutz",
  selected_count: 2,
  products_with_active_source_urls: 1,
  products_without_active_source_urls: 1,
  coverage_percent: 50,
  active_source_url_count: 1,
  needs_review_source_url_count: 1,
  broken_source_url_count: 0,
  disabled_source_url_count: 0,
  redirected_source_url_count: 0,
  missing_source_url_models: ["AB-123"],
  missing_source_url_catalog_product_ids: [2],
  warning: "Fetch will use active source URLs when available; products without active URLs may fall back to source search.",
};

export const createdSourceUrl = {
  id: 103,
  catalog_product_id: 1,
  catalog_source: "sourceCata",
  model: "005606",
  mpn: "MD-20L",
  manufacturer: "Midea",
  source_name: "public",
  source_domain: "public.gr",
  url: "https://www.public.gr/product/midea-md-20l",
  url_normalized: "https://www.public.gr/product/midea-md-20l",
  status: "active",
  url_type: "manual",
  trust_level: "manual",
  added_by: "operator",
  notes: null,
  last_seen_at: null,
  last_success_at: null,
  last_failed_at: null,
  failure_count: 0,
  last_error: null,
  created_at: "2026-05-02T09:00:00Z",
  updated_at: "2026-05-02T09:00:00Z",
};

export const sourceUrlValidationSuccess = {
  item: {
    ...sourceUrlsForCatalogProduct.items[0],
    status: "active",
    last_success_at: "2026-05-02T09:10:00Z",
    failure_count: 0,
    last_error: null,
  },
  validation: {
    status: "success",
    message: "URL is reachable.",
    http_status_code: 200,
  },
};

export const sourceUrlValidationBroken = {
  item: {
    ...sourceUrlsForCatalogProduct.items[0],
    status: "broken",
    last_failed_at: "2026-05-02T09:15:00Z",
    failure_count: 1,
    last_error: "URL returned HTTP 404.",
  },
  validation: {
    status: "failed",
    message: "URL returned HTTP 404.",
    http_status_code: 404,
  },
};

export const sourceUrlImportPreview = {
  mode: "preview",
  applied: false,
  summary: {
    candidates_found: 4,
    imported_count: 2,
    updated_count: 1,
    skipped_count: 1,
    active_count: 2,
    needs_review_count: 1,
    invalid_url_count: 0,
    duplicate_count: 1,
    unresolved_identity_count: 0,
    ambiguous_identity_count: 1,
    would_import_count: 2,
    would_update_count: 1,
  },
  warnings: ["Ambiguous identity for artifact row model MIXED-001."],
  skipped_reasons: {
    ambiguous_identity: 1,
  },
  changed_source_urls: [],
  sources: {
    observations: { candidates_found: 2 },
    artifacts: { candidates_found: 2 },
  },
  candidate_evidence: [],
  items: [
    {
      action: "created",
      status: "active",
      source_name: "skroutz",
      source_domain: "skroutz.gr",
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      url: "https://www.skroutz.gr/s/123/midea-md-20l.html",
      evidence_source: "price_observations",
      evidence_detail: "run pm-run-001 matched by model",
      reason: null,
      confidence: "high",
      catalog_product_id: 1,
      source_url_id: null,
    },
    {
      action: "created",
      status: "needs_review",
      source_name: "bestprice",
      source_domain: "bestprice.gr",
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      url: "https://www.bestprice.gr/item/456/midea-md-20l.html",
      evidence_source: "enriched_artifact",
      evidence_detail: "legacy enriched CSV",
      reason: null,
      confidence: "medium",
      catalog_product_id: 1,
      source_url_id: null,
    },
    {
      action: "skipped",
      status: "needs_review",
      source_name: "unknown",
      source_domain: "example.test",
      catalog_source: "sourceCata",
      model: "MIXED-001",
      mpn: null,
      url: "https://example.test/mixed",
      evidence_source: "legacy_run_folder",
      evidence_detail: "legacy run output",
      reason: "ambiguous_identity",
      confidence: "low",
      catalog_product_id: null,
      source_url_id: null,
    },
  ],
  truncated: false,
};

export const sourceUrlImportApply = {
  ...sourceUrlImportPreview,
  mode: "apply",
  applied: true,
  changed_source_urls: [
    {
      action: "created",
      changed_fields: [],
      source_url: {
        ...sourceUrlsForCatalogProduct.items[1],
        id: 104,
      },
    },
  ],
};

export const sourceUrlCandidates = {
  items: [
    {
      id: 501,
      run_id: "source-run-001",
      catalog_product_id: 1,
      model: "005606",
      mpn: "MD-20L",
      manufacturer: "Midea",
      product_name: "Midea Αφυγραντήρας 20L",
      category: "Αφυγραντήρες",
      own_price: 199.9,
      source_name: "skroutz",
      source_domain: "skroutz.gr",
      source_type: "marketplace",
      expected_listing: true,
      candidate_url: "https://www.skroutz.gr/s/999/midea-md-20l-candidate.html",
      canonical_url: "https://www.skroutz.gr/s/999/midea-md-20l-candidate.html",
      candidate_title: "Midea MD-20L Αφυγραντήρας 20L",
      candidate_price: 189.9,
      match_status: "strong_match",
      confidence_score: 0.9823,
      match_method: "mpn_model_title",
      evidence_json: {
        mpn_evidence: { expected: "MD-20L", found: true },
        model_evidence: { expected: "005606", found: true },
        brand_evidence: { expected: "Midea", found: true },
        category_evidence: { expected: "Αφυγραντήρες", found: true },
        price_evidence: { own_price: 199.9, candidate_price: 189.9 },
        title_similarity: 0.94,
        title_only: false,
      },
      competing_candidates_count: 2,
      searched_queries_json: ["Midea MD-20L", "005606 Midea"],
      status: "needs_review",
      reviewed_by: null,
      reviewed_at: null,
      notes: "High confidence candidate.",
      created_at: "2026-05-02T10:00:00Z",
      updated_at: "2026-05-02T10:00:00Z",
    },
    {
      id: 502,
      run_id: "source-run-001",
      catalog_product_id: 2,
      model: "AB-123",
      mpn: null,
      manufacturer: "ΓΕΡΜΑΝΟΣ",
      product_name: "Σετ πληκτρολόγιο και ποντίκι",
      category: "Πληκτρολόγια",
      own_price: 39.9,
      source_name: "bestprice",
      source_domain: "bestprice.gr",
      candidate_url: "https://www.bestprice.gr/item/999/keyboard-mouse.html",
      candidate_title: "Keyboard mouse bundle",
      candidate_price: 38.9,
      match_status: "weak_match",
      confidence_score: 0.6211,
      match_method: "title_only",
      evidence_json: {
        title_similarity: 0.52,
        title_only: true,
        error_code: null,
      },
      searched_queries_json: ["AB-123 keyboard"],
      status: "needs_review",
      created_at: "2026-05-02T10:20:00Z",
    },
  ],
  total: 2,
  limit: 50,
  offset: 0,
};

export const catalogProductsEmptyImportWarning = {
  items: [],
  page: 1,
  page_size: 100,
  total: 0,
  filtered_total: 0,
  warning: "Active catalog is empty. Run python -m pricefetcher.jobs.ingest_catalog.",
};

export const catalogDbImportRequiredError = {
  status: 503,
  body: {
    detail: "Catalog database/import required. Configure PostgreSQL, run migrations, and import sourceCata.csv.",
    code: "catalog_database_import_required",
    required_for: ["catalog"],
    ready_for_catalog: false,
    configured: true,
    reachable: true,
    required_tables_present: true,
    alembic_up_to_date: true,
    active_catalog_empty: true,
    blocking_reasons: ["Active catalog is empty. Run python -m pricefetcher.jobs.ingest_catalog."],
    non_catalog_workflows_available: true,
    setup_hints: [
      "Set PRICEFETCHER_DATABASE_URL.",
      "Run alembic upgrade head.",
      "Run python -m pricefetcher.jobs.ingest_catalog.",
    ],
  },
};

export const dbStatusAvailable = {
  configured: true,
  reachable: true,
  price_monitoring_requires_database: true,
  ready_for_price_monitoring: true,
  blocking_reasons: [],
  non_db_workflows_available: true,
  required_for: ["price-monitoring", "price-monitoring-alerts", "price-monitoring-history"],
  error: null,
  dialect: "postgresql",
  required_tables_present: true,
  alembic_up_to_date: true,
  alembic_current_revision: "202605020001",
  alembic_head_revision: "202605020001",
  setup_hints: [],
};

export const dbStatusNotConfigured = {
  configured: false,
  reachable: false,
  price_monitoring_requires_database: true,
  ready_for_price_monitoring: false,
  blocking_reasons: ["PRICEFETCHER_DATABASE_URL is not configured."],
  non_db_workflows_available: true,
  required_for: ["price-monitoring", "price-monitoring-alerts", "price-monitoring-history"],
  dialect: null,
  error: "database URL is not configured",
  required_tables_present: null,
  alembic_up_to_date: null,
  setup_hints: ["Set PRICEFETCHER_DATABASE_URL.", "Run alembic upgrade head.", "Restart pricefetcher-api."],
};

export const dbStatusUnavailable = {
  configured: true,
  reachable: false,
  price_monitoring_requires_database: true,
  ready_for_price_monitoring: false,
  blocking_reasons: ["PostgreSQL is configured but not reachable."],
  non_db_workflows_available: true,
  required_for: ["price-monitoring", "price-monitoring-alerts", "price-monitoring-history"],
  dialect: "postgresql",
  error: "connection refused",
  required_tables_present: null,
  alembic_up_to_date: null,
  setup_hints: ["Start PostgreSQL.", "Run alembic upgrade head."],
};

export const dbStatusMigrationMissing = {
  configured: true,
  reachable: true,
  price_monitoring_requires_database: true,
  ready_for_price_monitoring: false,
  blocking_reasons: ["Required Price Monitoring tables are missing.", "Alembic migrations are not up to date."],
  non_db_workflows_available: true,
  required_for: ["price-monitoring", "price-monitoring-alerts", "price-monitoring-history"],
  dialect: "postgresql",
  error: null,
  required_tables_present: false,
  alembic_up_to_date: false,
  alembic_current_revision: "202604010001",
  alembic_head_revision: "202605020001",
  setup_hints: ["Run alembic upgrade head."],
};

export const priceMonitoringExecutions = [
  {
    run_id: "pm-run-001",
    execution_id: "exec-running",
    status: "running",
    source: "skroutz",
    queued_at: "2026-05-02T09:00:00Z",
    started_at: "2026-05-02T09:01:00Z",
    queue_position: 1,
    process_id: 4242,
    catalog_url: null,
  },
  {
    run_id: "pm-run-001",
    execution_id: "exec-success",
    status: "fetch_completed",
    source: "skroutz",
    queued_at: "2026-05-02T08:00:00Z",
    started_at: "2026-05-02T08:01:00Z",
    completed_at: "2026-05-02T08:10:00Z",
    exit_code: 0,
    input_csv_path: {
      name: "input.csv",
      path: "price-monitoring/pm-run-001/input.csv",
      download_url: "/api/artifacts/price-monitoring/pm-run-001/input.csv",
      read_url: "/api/artifacts/price-monitoring/pm-run-001/input.csv/read",
      is_allowed: true,
      can_read: true,
      can_download: true,
    },
    enriched_csv_path: "price-monitoring/pm-run-001/enriched.csv",
    fetch_result_path: "price-monitoring/pm-run-001/fetch-result.json",
    log_path: "price-monitoring/pm-run-001/fetch.log",
    artifacts: [
      {
        name: "enriched.csv",
        path: "price-monitoring/pm-run-001/enriched.csv",
        download_url: "/api/artifacts/price-monitoring/pm-run-001/enriched.csv",
        read_url: "/api/artifacts/price-monitoring/pm-run-001/enriched.csv/read",
        is_allowed: true,
        can_read: true,
        can_download: true,
        warning: null,
      },
    ],
    observation_count: 2,
    appended_observation_count: 2,
    prior_observation_count: 1,
    catalog_snapshot_count: 2,
    matched_observation_count: 1,
    unmatched_observation_count: 1,
    was_refetch: true,
    fetch_attempt: 2,
    observation_batch_id: "exec-success",
    observation_history_count: 3,
    stale: false,
    queue_position: null,
  },
  {
    run_id: "pm-run-001",
    execution_id: "exec-failed",
    status: "failed",
    source: "bestprice",
    queued_at: "2026-05-02T07:00:00Z",
    started_at: "2026-05-02T07:01:00Z",
    completed_at: "2026-05-02T07:03:00Z",
    exit_code: 1,
    artifacts_are_diagnostic: true,
    artifact_warning: "Failure artifacts are diagnostic only.",
  },
  {
    run_id: "pm-run-001",
    execution_id: "exec-cancelled",
    status: "cancelled",
    source: "skroutz",
    queued_at: "2026-05-02T06:00:00Z",
    cancelled_at: "2026-05-02T06:02:00Z",
    cancel_reason: "operator cancelled",
  },
  {
    run_id: "pm-run-001",
    execution_id: "exec-killed",
    status: "killed",
    source: "skroutz",
    queued_at: "2026-05-02T05:00:00Z",
    started_at: "2026-05-02T05:01:00Z",
    killed_at: "2026-05-02T05:05:00Z",
    killed_reason: "timeout",
    termination_mode: "kill",
    exit_code: 137,
  },
];

export const priceMonitoringRunItems = [
    {
      run_id: "pm-run-001",
      status: "created",
      source: "skroutz",
      selected_count: 2,
      skipped_count: 0,
      source_url_coverage: sourceUrlCoverage,
      created_at: "2026-05-02T08:00:00Z",
      latest_fetch: priceMonitoringExecutions[1],
    },
    {
      run_id: "pm-run-queued",
      status: "queued",
      source: "bestprice",
      selected_count: 1,
      skipped_count: 0,
      source_url_coverage: {
        ...sourceUrlCoverage,
        source: "bestprice",
        selected_count: 1,
        products_with_active_source_urls: 1,
        products_without_active_source_urls: 0,
        coverage_percent: 100,
        missing_source_url_models: [],
        missing_source_url_catalog_product_ids: [],
        warning: null,
      },
      created_at: "2026-05-02T09:00:00Z",
      latest_fetch: {
        run_id: "pm-run-queued",
        execution_id: "exec-queued",
        status: "queued",
        source: "bestprice",
        queued_at: "2026-05-02T09:05:00Z",
      },
    },
  ];

export const priceMonitoringRuns = {
  items: priceMonitoringRunItems,
  runs: priceMonitoringRunItems,
};

export const priceMonitoringRunDetail = {
  run_id: "pm-run-001",
  status: "created",
  source: "skroutz",
  selected_count: 2,
  skipped_count: 0,
  source_url_coverage: sourceUrlCoverage,
  created_at: "2026-05-02T08:00:00Z",
  latest_fetch: priceMonitoringExecutions[1],
  db: {
    persisted: true,
    reachable: true,
  },
};

export const priceMonitoringSelectionResult = {
  run_id: "pm-run-001",
  status: "selection_created",
  source: "skroutz",
  output_dir: "price-monitoring/pm-run-001",
  input_csv_path: "price-monitoring/pm-run-001/input.csv",
  selection_summary_path: "price-monitoring/pm-run-001/selection-summary.json",
  selected_count: 2,
  skipped_count: 0,
  skipped_by_reason: {},
  source_url_coverage: sourceUrlCoverage,
  selected_items: [
    {
      ...catalogProducts.items[0],
      source_url_coverage: {
        source: "skroutz",
        has_active_source_url: true,
        active_source_url_count: 1,
        status_counts: { active: 1, needs_review: 1, broken: 0, disabled: 0, redirected: 0 },
        active_source_urls: [sourceUrlsForCatalogProduct.items[0]],
      },
    },
    {
      ...catalogProducts.items[1],
      source_url_coverage: {
        source: "skroutz",
        has_active_source_url: false,
        active_source_url_count: 0,
        status_counts: { active: 0, needs_review: 0, broken: 0, disabled: 0, redirected: 0 },
        active_source_urls: [],
        warning: "No active skroutz source URLs for this product.",
      },
    },
  ],
};

(priceMonitoringSelectionResult as { items?: unknown }).items = priceMonitoringSelectionResult.selected_items;

export const priceMonitoringRunObservations = {
  run_id: "pm-run-001",
  items: [
    {
      id: 301,
      product_id: 1,
      product_source_id: 1001,
      source_capture_snapshot_id: 9001,
      run_id: "pm-run-001",
      execution_id: "exec-success",
      fetch_attempt: 2,
      was_refetch: true,
      observation_batch_id: "exec-success",
      catalog_source: "sourceCata",
      source: "skroutz",
      model: "005606",
      mpn: "MD-20L",
      product_name: "Midea Αφυγραντήρας 20L",
      competitor_name: "Mock Store",
      competitor_price: 189.9,
      own_price: 199.9,
      price_delta: -10,
      price_delta_percent: -5,
      currency: "EUR",
      availability: "available",
      product_url: "https://www.skroutz.gr/s/123/midea-md-20l.html",
      matched_by: "model",
      match_status: "matched",
      is_matched: true,
      observed_at: "2026-05-02T08:09:00Z",
      created_at: "2026-05-02T08:10:00Z",
      raw_observation: { persistence: { fetch_attempt: 2, was_refetch: true, execution_id: "exec-success" } },
    },
    {
      id: 300,
      product_id: 1,
      run_id: "pm-run-001",
      execution_id: "exec-old",
      fetch_attempt: 1,
      was_refetch: false,
      observation_batch_id: "exec-old",
      catalog_source: "sourceCata",
      source: "skroutz",
      model: "005606",
      mpn: "MD-20L",
      product_name: "Midea Αφυγραντήρας 20L",
      competitor_name: "Older Store",
      competitor_price: 199.9,
      own_price: 199.9,
      price_delta: 0,
      price_delta_percent: 0,
      currency: "EUR",
      availability: "available",
      product_url: "https://www.skroutz.gr/s/old/midea-md-20l.html",
      matched_by: "model",
      match_status: "matched",
      is_matched: true,
      observed_at: "2026-05-02T07:09:00Z",
      created_at: "2026-05-02T07:10:00Z",
      raw_observation: { persistence: { fetch_attempt: 1, was_refetch: false, execution_id: "exec-old" } },
    },
  ],
  count: 2,
  matched_count: 2,
  unmatched_count: 0,
};

export const priceMonitoringFetchLogs = {
  run_id: "pm-run-001",
  execution_id: "exec-success",
  lines: ["fetch started", "matched model 005606", "fetch completed"],
  logs: ["fetch started", "matched model 005606", "fetch completed"],
};

export const priceMonitoringReview = {
  run_id: "pm-run-001",
  items: [
    {
      model: "005606",
      mpn: "MD-20L",
      name: "Midea Αφυγραντήρας 20L",
      source: "skroutz",
      current_price: 199.9,
      competitor_store: "Mock Store",
      competitor_price: 189.9,
      price_delta: -10,
      price_delta_percent: -5,
      recommended_action: "match_price",
      selected_action: "",
      warnings: ["Competitor below own price"],
    },
  ],
  summary: { match_price: 1, undercut: 0, ignore: 0 },
  review_csv_path: {
    name: "review.csv",
    path: "price-monitoring/pm-run-001/review.csv",
    download_url: "/api/artifacts/price-monitoring/pm-run-001/review.csv",
    read_url: "/api/artifacts/price-monitoring/pm-run-001/review.csv/read",
    is_allowed: true,
    can_read: true,
    can_download: true,
  },
  enriched_csv_path: "price-monitoring/pm-run-001/enriched.csv",
};

export const priceMonitoringArtifacts = {
  root: "price-monitoring",
  run_id: "pm-run-001",
  items: [
    {
      name: "enriched.csv",
      path: "price-monitoring/pm-run-001/enriched.csv",
      download_url: "/api/artifacts/price-monitoring/pm-run-001/enriched.csv",
      read_url: "/api/artifacts/price-monitoring/pm-run-001/enriched.csv/read",
      is_allowed: true,
      can_read: true,
      can_download: true,
      warning: null,
    },
    {
      name: "secret.env",
      path: "C:/outside/secret.env",
      download_url: null,
      read_url: null,
      is_allowed: false,
      can_read: false,
      can_download: false,
      warning: "Path is outside configured artifact roots.",
    },
  ],
};

export const pathRoots = {
  artifact_roots: {
    roots: [
      {
        path: "D:/mock/artifacts",
        exists: true,
        name: "mock-artifacts",
        source: "fixture",
        is_default: true,
        is_configured: true,
      },
    ],
  },
  file_roots: { roots: [] },
  output_roots: { roots: [] },
  env: { PRICEFETCHER_ARTIFACT_ROOTS: "D:/mock/artifacts" },
  path_separator: "\\",
  platform: "Windows",
};

export const alertRules = {
  items: [
    {
      id: 101,
      name: "005606 below own price",
      rule_type: "competitor_below_own_price",
      product_id: null,
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      threshold_amount: 1,
      threshold_percent: 3,
      active: true,
      created_at: "2026-05-02T08:00:00Z",
      updated_at: "2026-05-02T08:00:00Z",
    },
  ],
  count: 1,
  limit: 100,
  offset: 0,
};

export const alertEvents = {
  items: [
    {
      id: 201,
      alert_rule_id: 101,
      monitoring_run_id: "pm-run-001",
      run_id: "pm-run-001",
      product_id: 5606,
      catalog_source: "sourceCata",
      model: "005606",
      mpn: "MD-20L",
      source: "skroutz",
      competitor_name: "Mock Store",
      own_price: 199.9,
      competitor_price: 189.9,
      price_delta: -10,
      price_delta_percent: -5,
      severity: "warning",
      status: "open",
      message: "Competitor price is below own price",
      triggered_at: "2026-05-02T08:11:00Z",
    },
    {
      id: 202,
      alert_rule_id: 101,
      monitoring_run_id: "pm-run-001",
      run_id: "pm-run-001",
      model: "AB-123",
      source: "bestprice",
      competitor_name: "Another Store",
      own_price: 39.9,
      competitor_price: 38.9,
      price_delta: -1,
      price_delta_percent: -2.5,
      severity: "info",
      status: "acknowledged",
      message: "Acknowledged fixture event",
      triggered_at: "2026-05-02T08:12:00Z",
    },
  ],
  count: 2,
  limit: 100,
  offset: 0,
};

function alertEventsResponse(request: MockRequest) {
  const status = request.searchParams.get("status");
  if (!status || status === "all") {
    return alertEvents;
  }

  const items = alertEvents.items.filter((event) => event.status === status);
  return {
    items,
    count: status === "open" ? 1 : items.length,
    limit: Number(request.searchParams.get("limit") ?? 100),
    offset: Number(request.searchParams.get("offset") ?? 0),
  };
}

function createSourceUrlResponse(request: MockRequest) {
  const body = typeof request.body === "object" && request.body !== null && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : {};
  return {
    ...createdSourceUrl,
    url: typeof body.url === "string" && body.url.trim().length > 0 ? body.url : createdSourceUrl.url,
    url_normalized:
      typeof body.url === "string" && body.url.trim().length > 0 ? body.url.trim() : createdSourceUrl.url_normalized,
    source_name: typeof body.source_name === "string" ? body.source_name : createdSourceUrl.source_name,
    notes: typeof body.notes === "string" ? body.notes : createdSourceUrl.notes,
  };
}

function updateSourceUrlResponse(request: MockRequest) {
  const body = typeof request.body === "object" && request.body !== null && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : {};
  return {
    ...sourceUrlsForCatalogProduct.items[0],
    url: typeof body.url === "string" ? body.url : sourceUrlsForCatalogProduct.items[0].url,
    url_normalized:
      typeof body.url === "string" ? body.url.trim().replace(/#.*$/, "") : sourceUrlsForCatalogProduct.items[0].url_normalized,
    source_name:
      typeof body.source_name === "string" || body.source_name === null
        ? body.source_name
        : sourceUrlsForCatalogProduct.items[0].source_name,
    source_domain: typeof body.url === "string" && body.url.includes("public.gr") ? "public.gr" : sourceUrlsForCatalogProduct.items[0].source_domain,
    status: typeof body.status === "string" ? body.status : sourceUrlsForCatalogProduct.items[0].status,
    notes: typeof body.notes === "string" || body.notes === null ? body.notes : sourceUrlsForCatalogProduct.items[0].notes,
    updated_at: "2026-05-02T09:20:00Z",
  };
}

function promoteSourceUrlResponse() {
  return {
    ...sourceUrlsForCatalogProduct.items[1],
    status: "active",
    updated_at: "2026-05-02T09:25:00Z",
  };
}

function sourceUrlCandidatesResponse(request: MockRequest) {
  const status = request.searchParams.get("status");
  const sourceName = request.searchParams.get("source_name");
  const items = sourceUrlCandidates.items.filter((candidate) => {
    const matchesStatus = !status || candidate.status === status;
    const matchesSource =
      !sourceName || candidate.source_name.toLowerCase().includes(sourceName.toLowerCase());
    return matchesStatus && matchesSource;
  });

  return {
    items,
    total: items.length,
    limit: Number(request.searchParams.get("limit") ?? 50),
    offset: Number(request.searchParams.get("offset") ?? 0),
  };
}

function reviewSourceUrlCandidateResponse(request: MockRequest) {
  const body =
    typeof request.body === "object" && request.body !== null && !Array.isArray(request.body)
      ? (request.body as Record<string, unknown>)
      : {};
  const decision = typeof body.decision === "string" ? body.decision : "needs_manual_review";
  const status =
    decision === "accept"
      ? "accepted"
      : decision === "reject"
        ? "rejected"
        : decision === "not_found"
          ? "not_found"
          : "needs_review";

  return {
    ...sourceUrlCandidates.items[0],
    candidate_url:
      decision === "replace_url" && typeof body.reviewed_url === "string"
        ? body.reviewed_url
        : sourceUrlCandidates.items[0].candidate_url,
    status,
    reviewed_by: body.reviewed_by ?? "operator",
    reviewed_at: "2026-05-02T11:00:00Z",
    notes:
      typeof body.review_notes === "string" ? body.review_notes : sourceUrlCandidates.items[0].notes,
    updated_at: "2026-05-02T11:00:00Z",
  };
}

export const commerceDbUnavailableError = {
  status: 503,
  body: {
    detail: "PostgreSQL is required for Price Monitoring.",
    status: dbStatusUnavailable,
    ready_for_price_monitoring: false,
    blocking_reasons: dbStatusUnavailable.blocking_reasons,
    non_db_workflows_available: true,
  },
};

export const commerceDbRequiredFixtureRoutes: MockRoute[] = [
  { method: "POST", path: "/commerce-api/price-monitoring/selection/preview", response: commerceDbUnavailableError },
  { method: "POST", path: "/commerce-api/price-monitoring/runs", response: commerceDbUnavailableError },
  { method: "GET", path: "/commerce-api/price-monitoring/runs", response: commerceDbUnavailableError },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001", response: commerceDbUnavailableError },
  { method: "POST", path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch", response: commerceDbUnavailableError },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch", response: commerceDbUnavailableError },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/executions",
    response: commerceDbUnavailableError,
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/logs",
    response: commerceDbUnavailableError,
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/exec-success",
    response: commerceDbUnavailableError,
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/exec-success/logs",
    response: commerceDbUnavailableError,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/cancel",
    response: commerceDbUnavailableError,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/exec-success/cancel",
    response: commerceDbUnavailableError,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001/review", response: commerceDbUnavailableError },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/review/actions",
    response: commerceDbUnavailableError,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/export-price-update",
    response: commerceDbUnavailableError,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/alerts/rules", response: commerceDbUnavailableError },
  { method: "POST", path: "/commerce-api/price-monitoring/alerts/rules", response: commerceDbUnavailableError },
  { method: "PATCH", path: "/commerce-api/price-monitoring/alerts/rules/101", response: commerceDbUnavailableError },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/alerts/rules/101/deactivate",
    response: commerceDbUnavailableError,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/alerts/events", response: commerceDbUnavailableError },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/alerts/events/201/acknowledge",
    response: commerceDbUnavailableError,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/alerts/events/201/resolve",
    response: commerceDbUnavailableError,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/alerts/evaluate/pm-run-001",
    response: commerceDbUnavailableError,
  },
];

export const catalogDbImportRequiredFixtureRoutes: MockRoute[] = [
  { method: "GET", path: "/commerce-api/catalog/products", response: catalogDbImportRequiredError },
  { method: "GET", path: "/commerce-api/catalog/summary", response: catalogDbImportRequiredError },
  { method: "GET", path: "/commerce-api/catalog/brands", response: catalogDbImportRequiredError },
  { method: "GET", path: "/commerce-api/catalog/category-hierarchy", response: catalogDbImportRequiredError },
  { method: "GET", path: "/commerce-api/catalog/products/1/source-urls", response: catalogDbImportRequiredError },
  { method: "POST", path: "/commerce-api/catalog/products/1/source-urls", response: catalogDbImportRequiredError },
  { method: "PATCH", path: "/commerce-api/catalog/source-urls/101", response: catalogDbImportRequiredError },
  { method: "PATCH", path: "/commerce-api/catalog/source-urls/102", response: catalogDbImportRequiredError },
  { method: "POST", path: "/commerce-api/catalog/source-urls/101/validate", response: catalogDbImportRequiredError },
  { method: "GET", path: "/commerce-api/catalog/source-urls/summary", response: catalogDbImportRequiredError },
  { method: "POST", path: "/commerce-api/catalog/source-urls/import/preview", response: catalogDbImportRequiredError },
  { method: "POST", path: "/commerce-api/catalog/source-urls/import/apply", response: catalogDbImportRequiredError },
];

export const commerceFixtureRoutes: MockRoute[] = [
  { method: "GET", path: "/commerce-api/health", response: commerceHealth },
  { method: "GET", path: "/commerce-api/catalog/summary", response: catalogSummary },
  { method: "GET", path: "/commerce-api/catalog/brands", response: catalogBrands },
  { method: "GET", path: "/commerce-api/catalog/category-hierarchy", response: catalogCategoryHierarchy },
  { method: "GET", path: "/commerce-api/catalog/products", response: catalogProducts },
  { method: "GET", path: "/commerce-api/catalog/products/1/source-urls", response: sourceUrlsForCatalogProduct },
  {
    method: "POST",
    path: "/commerce-api/catalog/products/1/source-urls",
    requestExample: { url: "https://www.public.gr/product/midea-md-20l", url_type: "manual" },
    response: createSourceUrlResponse,
  },
  {
    method: "PATCH",
    path: "/commerce-api/catalog/source-urls/101",
    requestExample: { status: "disabled" },
    response: updateSourceUrlResponse,
  },
  {
    method: "PATCH",
    path: "/commerce-api/catalog/source-urls/102",
    requestExample: { status: "active" },
    response: promoteSourceUrlResponse,
  },
  { method: "POST", path: "/commerce-api/catalog/source-urls/101/validate", response: sourceUrlValidationBroken },
  { method: "GET", path: "/commerce-api/catalog/source-urls/summary", response: sourceUrlSummary },
  { method: "GET", path: "/commerce-api/catalog/source-url-agent/candidates", response: sourceUrlCandidatesResponse },
  {
    method: "PATCH",
    path: "/commerce-api/catalog/source-url-agent/candidates/501/review",
    requestExample: {
      decision: "accept",
      reviewed_url: null,
      review_notes: "High confidence candidate.",
      reviewed_by: "operator",
    },
    response: reviewSourceUrlCandidateResponse,
  },
  {
    method: "POST",
    path: "/commerce-api/catalog/source-urls/import/preview",
    requestExample: {
      catalog_source: "sourceCata",
      include_observations: true,
      include_artifacts: true,
      include_legacy_runs: false,
      limit: 100,
      report_items_limit: 200,
    },
    response: sourceUrlImportPreview,
  },
  {
    method: "POST",
    path: "/commerce-api/catalog/source-urls/import/apply",
    requestExample: {
      catalog_source: "sourceCata",
      include_observations: true,
      include_artifacts: true,
      include_legacy_runs: false,
      limit: 100,
      report_items_limit: 200,
    },
    response: sourceUrlImportApply,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/db/status", response: dbStatusAvailable },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/selection/preview",
    requestExample: { source: "skroutz", selected_models: ["005606", "AB-123"], dry_run: true },
    response: priceMonitoringSelectionResult,
  },
  {
    method: "POST",
    path: "/commerce-api/price-monitoring/runs",
    requestExample: { source: "skroutz", selected_models: ["005606", "AB-123"], dry_run: false },
    response: priceMonitoringSelectionResult,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/runs", response: priceMonitoringRuns },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001", response: priceMonitoringRunDetail },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch", response: priceMonitoringExecutions[1] },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/executions",
    response: {
      items: priceMonitoringExecutions,
      executions: priceMonitoringExecutions,
      count: priceMonitoringExecutions.length,
      run_id: "pm-run-001",
    },
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/logs",
    response: priceMonitoringFetchLogs,
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/fetch/exec-success/logs",
    response: priceMonitoringFetchLogs,
  },
  { method: "GET", path: "/commerce-api/price-monitoring/runs/pm-run-001/review", response: priceMonitoringReview },
  { method: "GET", path: "/commerce-api/price-monitoring/alerts/rules", response: alertRules },
  { method: "GET", path: "/commerce-api/price-monitoring/alerts/events", response: alertEventsResponse },
  {
    method: "GET",
    path: "/commerce-api/artifacts/price-monitoring/runs/pm-run-001",
    response: priceMonitoringArtifacts,
  },
  { method: "GET", path: "/commerce-api/files/roots", response: { roots: [] } },
  { method: "GET", path: "/commerce-api/artifacts/roots", response: { roots: pathRoots.artifact_roots.roots } },
  { method: "GET", path: "/commerce-api/paths/roots", response: pathRoots },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/observations",
    response: priceMonitoringRunObservations,
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/catalog-snapshot",
    response: { run_id: "pm-run-001", items: [], count: 0 },
  },
];
