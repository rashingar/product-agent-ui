export type JobStatus = string;

export type WorkflowType = "prepare" | "render" | "publish";

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
