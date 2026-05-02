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

export const dbStatusAvailable = {
  configured: true,
  reachable: true,
  error: null,
  dialect: "postgresql",
  required_tables_present: true,
  alembic_up_to_date: true,
  alembic_current_revision: "202605020001",
  alembic_head_revision: "202605020001",
  setup_hints: [],
};

export const dbStatusUnavailable = {
  configured: true,
  reachable: false,
  dialect: "postgresql",
  error: "connection refused",
  required_tables_present: null,
  alembic_up_to_date: null,
  setup_hints: ["Start PostgreSQL or disable persistence for local smoke tests."],
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
      created_at: "2026-05-02T08:00:00Z",
      latest_fetch: priceMonitoringExecutions[1],
    },
    {
      run_id: "pm-run-queued",
      status: "queued",
      source: "bestprice",
      selected_count: 1,
      skipped_count: 0,
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
  created_at: "2026-05-02T08:00:00Z",
  latest_fetch: priceMonitoringExecutions[1],
  db: {
    persisted: true,
    reachable: true,
  },
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

export const commerceDbUnavailableError = {
  status: 503,
  body: {
    detail: "Price monitoring database is unavailable.",
    status: dbStatusUnavailable,
  },
};

export const commerceFixtureRoutes: MockRoute[] = [
  { method: "GET", path: "/commerce-api/health", response: commerceHealth },
  { method: "GET", path: "/commerce-api/catalog/summary", response: catalogSummary },
  { method: "GET", path: "/commerce-api/catalog/brands", response: catalogBrands },
  { method: "GET", path: "/commerce-api/catalog/category-hierarchy", response: catalogCategoryHierarchy },
  { method: "GET", path: "/commerce-api/catalog/products", response: catalogProducts },
  { method: "GET", path: "/commerce-api/price-monitoring/db/status", response: dbStatusAvailable },
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
    response: { run_id: "pm-run-001", items: [], count: 0, matched_count: 0, unmatched_count: 0 },
  },
  {
    method: "GET",
    path: "/commerce-api/price-monitoring/runs/pm-run-001/catalog-snapshot",
    response: { run_id: "pm-run-001", items: [], count: 0 },
  },
];
