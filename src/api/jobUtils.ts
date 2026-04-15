import type { Job, WorkflowType } from "./types";

const ACTIVE_STATUSES = new Set([
  "queued",
  "pending",
  "running",
  "in_progress",
  "preparing",
  "rendering",
  "publishing",
]);

const SUCCESS_STATUSES = new Set(["succeeded", "success", "completed", "done"]);
const FAILURE_STATUSES = new Set(["failed", "failure", "error", "cancelled", "canceled"]);
const WORKFLOW_LABELS: Record<WorkflowType, string> = {
  prepare: "Prepare",
  render: "Render",
  publish: "Publish",
};

const STAGE_STATUSES: Record<string, WorkflowType> = {
  preparing: "prepare",
  rendering: "render",
  publishing: "publish",
};

function normalizeStageValue(value: unknown): WorkflowType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "prepare" || normalized === "render" || normalized === "publish") {
    return normalized;
  }

  return undefined;
}

export function getJobIdentifier(job: Job): string | undefined {
  const rawId = job.job_id ?? job.id;
  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId;
  }

  if (typeof rawId === "number") {
    return String(rawId);
  }

  return undefined;
}

export function getJobStatus(job: Job | undefined): string {
  const rawStatus = job?.status ?? job?.state;
  return typeof rawStatus === "string" && rawStatus.trim().length > 0
    ? rawStatus
    : "unknown";
}

export function getNormalizedStatus(job: Job | undefined): string {
  return getJobStatus(job).trim().toLowerCase();
}

export function isActiveJob(job: Job | undefined): boolean {
  return ACTIVE_STATUSES.has(getNormalizedStatus(job));
}

export function isSuccessfulJob(job: Job | undefined): boolean {
  return SUCCESS_STATUSES.has(getNormalizedStatus(job));
}

export function isFailedJob(job: Job | undefined): boolean {
  return FAILURE_STATUSES.has(getNormalizedStatus(job));
}

export function getJobWorkflow(job: Job): string {
  const rawWorkflow = job.workflow ?? job.job_type ?? job.type ?? job.kind;
  return typeof rawWorkflow === "string" && rawWorkflow.trim().length > 0
    ? rawWorkflow
    : "job";
}

export function withJobStage(job: Job, stage: WorkflowType): Job {
  return { ...job, client_stage: stage };
}

export function getJobStage(job: Job): WorkflowType | undefined {
  return (
    normalizeStageValue(job.client_stage) ??
    normalizeStageValue(job.stage) ??
    normalizeStageValue(job.workflow_stage) ??
    normalizeStageValue(job.pipeline_stage) ??
    normalizeStageValue(job.workflow) ??
    normalizeStageValue(job.job_type) ??
    normalizeStageValue(job.type) ??
    normalizeStageValue(job.kind) ??
    STAGE_STATUSES[getNormalizedStatus(job)]
  );
}

export function getJobStageLabel(job: Job): string {
  const stage = getJobStage(job);
  return stage ? WORKFLOW_LABELS[stage] : getJobWorkflow(job);
}

export function getRequestPayload(job: Job): unknown {
  return job.request_payload ?? job.request ?? job.payload ?? job.input ?? null;
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}
