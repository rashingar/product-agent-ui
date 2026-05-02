export type JobStatus = string;

export type WorkflowType = "prepare" | "render" | "publish";

export type ProductAgentStageName =
  | "prepare"
  | "authoring_intro"
  | "authoring_seo"
  | "filter_review"
  | "render"
  | "publish";

export interface PrepareJobRequest {
  model: string;
  url: string;
  photos: number;
  sections: number;
  skroutz_status: number;
  boxnow: number;
  price: number | null;
}

export interface ModelJobRequest {
  model: string;
}

export type RenderJobRequest = ModelJobRequest;

export type PublishJobRequest = ModelJobRequest;

export interface StopJobRequest {
  reason?: string | null;
}

export interface HealthResponse {
  status?: string;
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface Job {
  job_id?: string | number;
  id?: string | number;
  status?: JobStatus;
  state?: JobStatus;
  stage?: string;
  workflow_stage?: string;
  pipeline_stage?: string;
  client_stage?: WorkflowType;
  job_type?: string;
  type?: string;
  workflow?: string;
  kind?: string;
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  finished_at?: string;
  request?: unknown;
  payload?: unknown;
  request_payload?: unknown;
  input?: unknown;
  result?: unknown;
  error?: unknown;
  error_code?: unknown;
  [key: string]: unknown;
}

export interface ArtifactRecord {
  name?: string;
  path?: string;
  url?: string;
  type?: string;
  size?: number;
  [key: string]: unknown;
}

export type Artifact = string | ArtifactRecord;

export interface LogRecord {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: unknown;
}

export type LogEntry = string | LogRecord;

export interface AuthoringTaskStatus {
  status?: string;
  output_path?: string | null;
  trace_path?: string | null;
  word_count?: number | null;
  min_words?: number | null;
  max_words?: number | null;
  max_attempts?: number | null;
  errors?: string[];
  [key: string]: unknown;
}

export interface AuthoringStatus {
  model: string;
  intro_text?: AuthoringTaskStatus | null;
  seo_meta?: AuthoringTaskStatus | null;
  ready_for_render?: boolean;
  render_block_reasons?: string[];
  warnings?: string[];
  [key: string]: unknown;
}

export interface FilterReviewGroup {
  group_id?: string | number | null;
  group_name?: string | null;
  required?: boolean;
  status?: string | null;
  allowed_values?: unknown[];
  resolved_value?: string | null;
  reviewed_value?: string | null;
  effective_value?: string | null;
  effective_value_id?: string | number | null;
  value_status?: string | null;
  source?: string | null;
  missing_required?: boolean;
  outside_allowed?: boolean;
  deprecated_value?: boolean;
  inactive_group?: boolean;
  emitted_if_rendered?: boolean;
  [key: string]: unknown;
}

export interface FilterReview {
  model: string;
  category_id?: string | number | null;
  taxonomy_path?: string | string[] | null;
  filter_category_found?: boolean;
  approved?: boolean;
  approved_at?: string | null;
  render_blocked?: boolean;
  render_block_reasons?: string[];
  missing_required_groups?: string[];
  groups?: FilterReviewGroup[];
  warnings?: string[];
  review_artifact_path?: string | null;
  [key: string]: unknown;
}

export interface ProductAgentSettings {
  authoring?: {
    intro_text?: {
      default?: {
        min_words?: number;
        max_words?: number;
        max_attempts?: number;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    seo_meta?: {
      default?: {
        meta_description_max_chars?: number;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
