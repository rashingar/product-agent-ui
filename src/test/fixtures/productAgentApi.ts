import type { MockRoute } from "../mockFetch";

export const productAgentHealth = {
  status: "ok",
  service: "product-agent",
  version: "test-fixture",
};

export const productAgentJobs = [
  {
    job_id: "job-queued-1",
    job_type: "prepare",
    model: "005606",
    status: "queued",
    workflow: "prepare",
    created_at: "2026-05-02T08:00:00Z",
    updated_at: "2026-05-02T08:00:00Z",
    request: { model: "005606" },
  },
  {
    job_id: "job-running-1",
    job_type: "render",
    model: "005606",
    status: "running",
    workflow: "render",
    created_at: "2026-05-02T08:05:00Z",
    updated_at: "2026-05-02T08:06:00Z",
    request: { model: "005606" },
  },
  {
    job_id: "job-succeeded-1",
    job_type: "publish",
    model: "005606",
    status: "succeeded",
    workflow: "publish",
    created_at: "2026-05-02T07:00:00Z",
    updated_at: "2026-05-02T07:10:00Z",
    request: { model: "005606" },
  },
  {
    job_id: "job-failed-1",
    job_type: "prepare",
    model: "AB-123",
    status: "failed",
    workflow: "prepare",
    created_at: "2026-05-02T06:00:00Z",
    updated_at: "2026-05-02T06:10:00Z",
    error: { message: "Image download failed" },
    request: { model: "AB-123" },
  },
  {
    job_id: "job-cancelled-1",
    job_type: "render",
    model: "AB-123",
    status: "cancelled",
    workflow: "render",
    created_at: "2026-05-02T05:00:00Z",
    updated_at: "2026-05-02T05:05:00Z",
    request: { model: "AB-123" },
  },
  {
    job_id: "job-killed-1",
    job_type: "publish",
    model: "AB-123",
    status: "killed",
    workflow: "publish",
    created_at: "2026-05-02T04:00:00Z",
    updated_at: "2026-05-02T04:05:00Z",
    error: { message: "Process killed by operator" },
    request: { model: "AB-123" },
  },
];

export const productAgentJobDetail = {
  ...productAgentJobs[2],
};

export const productAgentJobLogs = {
  job_id: "job-succeeded-1",
  lines: ["Render started", "Render succeeded"],
  logs: [
    { timestamp: "2026-05-02T07:01:00Z", level: "info", message: "Render started" },
    { timestamp: "2026-05-02T07:10:00Z", level: "info", message: "Render succeeded" },
  ],
};

export const productAgentJobArtifacts = {
  job_id: "job-succeeded-1",
  artifacts: [
    {
      name: "product-page.html",
      path: "runs/job-succeeded-1/product-page.html",
      url: "/api/jobs/job-succeeded-1/artifacts/product-page.html",
      type: "text/html",
      size: 2048,
    },
  ],
};

export const productAgentSettings = {
  schema_version: 1,
  authoring: {
    intro_text: {
      default: {
        min_words: 80,
        max_words: 140,
        max_attempts: 3,
      },
    },
    seo_meta: {
      default: {
        meta_description_max_chars: 155,
      },
    },
  },
  settings: {
    schema_version: 1,
    authoring: {
      intro_text: {
        default: {
          min_words: 80,
          max_words: 140,
          max_attempts: 3,
        },
      },
      seo_meta: {
        default: {
          meta_description_max_chars: 155,
        },
      },
    },
  },
};

export const productAgentFilterStatus = {
  filter_map_base_path: "fixtures/base-filter-map.json",
  filter_map_manual_overrides_path: "fixtures/manual-filter-overrides.json",
  filter_map_path: "fixtures/filter-map.json",
  sync_report_path: "fixtures/filter-sync-report.json",
  valid_statuses: ["active", "inactive", "deprecated"],
  status: "ready",
  category_count: 2,
  group_count: 3,
  value_count: 6,
  filters: {
    filter_map_base_path: "fixtures/base-filter-map.json",
    filter_map_manual_overrides_path: "fixtures/manual-filter-overrides.json",
    filter_map_path: "fixtures/filter-map.json",
    sync_report_path: "fixtures/filter-sync-report.json",
    valid_statuses: ["active", "inactive", "deprecated"],
    status: "ready",
    category_count: 2,
    group_count: 3,
    value_count: 6,
  },
};

export const productAgentFilterCategories = {
  categories: [
    {
      category_id: 310,
      path: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
      parent_category: "Κλιματισμός",
      leaf_category: "Αφυγραντήρες",
      sub_category: "Αφυγραντήρες",
      key: "climate/dehumidifiers",
      group_count: 2,
      active_group_count: 2,
      required_group_count: 1,
      inactive_group_count: 0,
      deprecated_group_count: 0,
      source: "merged",
    },
    {
      category_id: 311,
      path: ["Τεχνολογία", "Περιφερειακά", "Πληκτρολόγια"],
      parent_category: "Περιφερειακά",
      leaf_category: "Πληκτρολόγια",
      sub_category: "Πληκτρολόγια",
      key: "tech/keyboards",
      group_count: 1,
      active_group_count: 1,
      required_group_count: 0,
      inactive_group_count: 0,
      deprecated_group_count: 0,
      source: "base",
    },
  ],
};

export const productAgentFilterCategoryDetail = {
  category_id: 310,
  path: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
  parent_category: "Κλιματισμός",
  leaf_category: "Αφυγραντήρες",
  sub_category: "Αφυγραντήρες",
  key: "climate/dehumidifiers",
  source: "merged",
  groups: [
    {
      group_id: "grp-capacity",
      name: "Χωρητικότητα",
      required: true,
      status: "active",
      source: "base",
      values: [
        { value_id: "val-12l", value: "12L", status: "active", source: "base" },
        { value_id: "val-20l", value: "20L", status: "active", source: "manual" },
      ],
    },
    {
      group_id: "grp-wifi",
      name: "Wi-Fi",
      required: false,
      status: "active",
      source: "manual",
      values: [
        { value_id: "val-yes", value: "Ναι", status: "active", source: "manual" },
        { value_id: "val-no", value: "Όχι", status: "active", source: "manual" },
      ],
    },
  ],
  category: {
    category_id: 310,
    path: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
    parent_category: "Κλιματισμός",
    leaf_category: "Αφυγραντήρες",
    sub_category: "Αφυγραντήρες",
    key: "climate/dehumidifiers",
    source: "merged",
    groups: [
      {
        group_id: "grp-capacity",
        name: "Χωρητικότητα",
        required: true,
        status: "active",
        source: "base",
        values: [
          { value_id: "val-12l", value: "12L", status: "active", source: "base" },
          { value_id: "val-20l", value: "20L", status: "active", source: "manual" },
        ],
      },
      {
        group_id: "grp-wifi",
        name: "Wi-Fi",
        required: false,
        status: "active",
        source: "manual",
        values: [
          { value_id: "val-yes", value: "Ναι", status: "active", source: "manual" },
          { value_id: "val-no", value: "Όχι", status: "active", source: "manual" },
        ],
      },
    ],
  },
};

export const productAgentFilterSyncReport = {
  mode: "mocked",
  warnings: [{ category_id: 310, message: "Manual value overrides base value" }],
  overridden_groups: [{ category_id: 310, group_id: "grp-wifi" }],
  overridden_values: [{ category_id: 310, value_id: "val-20l" }],
  report: {
    mode: "mocked",
    base_path: "fixtures/base-filter-map.json",
    manual_overrides_path: "fixtures/manual-filter-overrides.json",
    filter_map_path: "fixtures/filter-map.json",
    warnings: [{ category_id: 310, message: "Manual value overrides base value" }],
    overridden_groups: [{ category_id: 310, group_id: "grp-wifi" }],
    overridden_values: [{ category_id: 310, value_id: "val-20l" }],
  },
};

export const productAgentFilterReview = {
  model: "005606",
  category_id: 310,
  taxonomy_path: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
  filter_category_found: true,
  approved: false,
  render_blocked: false,
  groups: [
    {
      group_id: "grp-capacity",
      group_name: "Χωρητικότητα",
      required: true,
      status: "active",
      allowed_values: ["12L", "20L"],
      resolved_value: "20L",
      reviewed_value: "20L",
      effective_value: "20L",
      effective_value_id: "val-20l",
      source: "manual",
    },
  ],
  warnings: ["Review before render"],
  review_artifact_path: "runs/005606/filter-review.json",
  review: {
    model: "005606",
    category_id: 310,
    taxonomy_path: ["Σπίτι", "Κλιματισμός", "Αφυγραντήρες"],
    filter_category_found: true,
    approved: false,
    render_blocked: false,
    groups: [
      {
        group_id: "grp-capacity",
        group_name: "Χωρητικότητα",
        required: true,
        status: "active",
        allowed_values: ["12L", "20L"],
        resolved_value: "20L",
        reviewed_value: "20L",
        effective_value: "20L",
        effective_value_id: "val-20l",
        source: "manual",
      },
    ],
    warnings: ["Review before render"],
    review_artifact_path: "runs/005606/filter-review.json",
  },
};

export const productAgentAuthoring = {
  model: "005606",
  llm_dir: "runs/005606/llm",
  intro_text: {
    status: "succeeded",
    output_path: "runs/005606/intro.txt",
    word_count: 112,
    min_words: 80,
    max_words: 140,
    max_attempts: 3,
    errors: [],
  },
  seo_meta: {
    status: "succeeded",
    output_path: "runs/005606/seo.json",
    max_attempts: 3,
    errors: [],
  },
  ready_for_render: true,
  render_block_reasons: [],
  warnings: [],
  authoring: {
    model: "005606",
    llm_dir: "runs/005606/llm",
    intro_text: {
      status: "succeeded",
      output_path: "runs/005606/intro.txt",
      word_count: 112,
      min_words: 80,
      max_words: 140,
      max_attempts: 3,
      errors: [],
    },
    seo_meta: {
      status: "succeeded",
      output_path: "runs/005606/seo.json",
      max_attempts: 3,
      errors: [],
    },
    ready_for_render: true,
    render_block_reasons: [],
    warnings: [],
  },
};

export const productAgentConflictError = {
  status: 409,
  body: { detail: "A job is already running for model 005606." },
};

export const productAgentValidationError = {
  status: 422,
  body: {
    detail: [
      { loc: ["body", "model"], msg: "Model is required" },
      { loc: ["body", "url"], msg: "URL is invalid" },
    ],
  },
};

export const productAgentFixtureRoutes: MockRoute[] = [
  { method: "GET", path: "/api/health", response: productAgentHealth },
  { method: "GET", path: "/api/jobs", response: { jobs: productAgentJobs } },
  { method: "GET", path: "/api/jobs/job-succeeded-1", response: productAgentJobDetail },
  { method: "GET", path: "/api/jobs/job-succeeded-1/logs", response: productAgentJobLogs },
  { method: "GET", path: "/api/jobs/job-succeeded-1/artifacts", response: productAgentJobArtifacts },
  { method: "GET", path: "/api/settings", response: productAgentSettings },
  { method: "GET", path: "/api/filters/status", response: productAgentFilterStatus },
  { method: "GET", path: "/api/filters/categories", response: productAgentFilterCategories },
  {
    method: "GET",
    path: "/api/filters/categories/310",
    response: productAgentFilterCategoryDetail,
  },
  { method: "GET", path: "/api/filters/sync-report", response: productAgentFilterSyncReport },
  { method: "GET", path: "/api/filter-review/005606", response: productAgentFilterReview },
  { method: "GET", path: "/api/authoring/005606", response: productAgentAuthoring },
];
