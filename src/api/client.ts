import type {
  Artifact,
  HealthResponse,
  Job,
  LogEntry,
  PrepareJobRequest,
  PublishJobRequest,
  RenderJobRequest,
  StopJobRequest,
} from "./types";
import { withJobStage } from "./jobUtils";

const DEFAULT_API_BASE_URL = "";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const apiBaseUrl =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of ["message", "detail", "error"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while talking to the backend.";
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildHeaders(options: ApiRequestOptions): HeadersInit {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = getPayloadMessage(payload) ?? `API request failed with ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function unwrapRecord(payload: unknown, keys: string[]): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined) {
      return value;
    }
  }

  return payload;
}

function looksLikeJob(record: Record<string, unknown>): boolean {
  return [
    "job_id",
    "id",
    "status",
    "state",
    "workflow",
    "job_type",
    "type",
    "kind",
    "created_at",
  ].some((key) => key in record);
}

function normalizeJob(payload: unknown): Job {
  const unwrapped =
    isRecord(payload) && !looksLikeJob(payload)
      ? unwrapRecord(payload, ["job", "data", "result"])
      : payload;
  return isRecord(unwrapped) ? (unwrapped as Job) : { result: unwrapped };
}

function normalizeJobList(payload: unknown): Job[] {
  const unwrapped = unwrapRecord(payload, ["jobs", "items", "data", "results"]);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : unwrapRecord(unwrapped, ["jobs", "items", "data", "results"]);
  return Array.isArray(list) ? (list.filter(isRecord) as Job[]) : [];
}

function normalizeLogs(payload: unknown): LogEntry[] {
  const unwrapped = unwrapRecord(payload, ["logs", "lines", "items", "data", "results"]);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : unwrapRecord(unwrapped, ["logs", "lines", "items", "data", "results"]);

  if (typeof list === "string") {
    return list.length > 0 ? [list] : [];
  }

  return Array.isArray(list)
    ? (list.filter((entry) => typeof entry === "string" || isRecord(entry)) as LogEntry[])
    : [];
}

function normalizeArtifacts(payload: unknown): Artifact[] {
  const unwrapped = unwrapRecord(payload, ["artifacts", "items", "data", "results"]);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : unwrapRecord(unwrapped, ["artifacts", "items", "data", "results"]);
  return Array.isArray(list)
    ? (list.filter((entry) => typeof entry === "string" || isRecord(entry)) as Artifact[])
    : [];
}

export const apiClient = {
  apiBaseUrl,

  getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health", { signal });
  },

  async createPrepareJob(body: PrepareJobRequest): Promise<Job> {
    return withJobStage(
      normalizeJob(await request<unknown>("/api/jobs/prepare", { method: "POST", body })),
      "prepare",
    );
  },

  async createRenderJob(body: RenderJobRequest): Promise<Job> {
    return withJobStage(
      normalizeJob(await request<unknown>("/api/jobs/render", { method: "POST", body })),
      "render",
    );
  },

  async createPublishJob(body: PublishJobRequest): Promise<Job> {
    return withJobStage(
      normalizeJob(await request<unknown>("/api/jobs/publish", { method: "POST", body })),
      "publish",
    );
  },

  async listJobs(signal?: AbortSignal): Promise<Job[]> {
    return normalizeJobList(await request<unknown>("/api/jobs", { signal }));
  },

  async getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
    return normalizeJob(
      await request<unknown>(`/api/jobs/${encodeURIComponent(jobId)}`, { signal }),
    );
  },

  async stopJob(jobId: string, reason?: string): Promise<Job> {
    const body: StopJobRequest = reason === undefined ? {} : { reason };
    return normalizeJob(
      await request<unknown>(`/api/jobs/${encodeURIComponent(jobId)}/stop`, {
        method: "POST",
        body,
      }),
    );
  },

  async getJobLogs(jobId: string, signal?: AbortSignal): Promise<LogEntry[]> {
    return normalizeLogs(
      await request<unknown>(`/api/jobs/${encodeURIComponent(jobId)}/logs`, { signal }),
    );
  },

  async getJobArtifacts(jobId: string, signal?: AbortSignal): Promise<Artifact[]> {
    return normalizeArtifacts(
      await request<unknown>(`/api/jobs/${encodeURIComponent(jobId)}/artifacts`, { signal }),
    );
  },
};
