import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, ApiError, getApiErrorMessage } from "../api/client";
import {
  compareJobsByUpdatedDesc,
  getJobIdentifier,
  getJobStage,
  getJobStatus,
  getRequestPayload,
  isActiveJob,
} from "../api/jobUtils";
import type {
  Artifact,
  AuthoringStatus,
  AuthoringTaskStatus,
  FilterReview,
  FilterReviewGroup,
  HealthResponse,
  Job,
  LogEntry,
  PrepareJobRequest,
  ProductAgentSettings,
  WorkflowType,
} from "../api/types";
import {
  initialPrepareFormState,
  PrepareJobForm,
  type PrepareFormState,
} from "../components/forms/PrepareJobForm";
import { ArtifactList } from "../components/jobs/ArtifactList";
import { LogsPanel } from "../components/jobs/LogsPanel";
import { StatusBadge } from "../components/jobs/StatusBadge";
import { EmptyState, ErrorState } from "../components/layout/StateBlocks";
import { useGlobalJobs } from "../hooks/useGlobalJobs";
import { usePersistentPageState } from "../hooks/usePersistentPageState";

const POLL_INTERVAL_MS = 2500;
const WORKFLOW_STORAGE_KEY = "product-agent-ui:workflow-shell:v1";

type ActionKey =
  | "prepare"
  | "authoring_load"
  | "intro_run"
  | "intro_retry"
  | "seo_run"
  | "seo_retry"
  | "filter_load"
  | "filter_save"
  | "filter_approve"
  | "render"
  | "publish"
  | "settings_load"
  | "settings_save";

interface StageActionState {
  busy: Partial<Record<ActionKey, boolean>>;
  messages: Partial<Record<ActionKey, string>>;
  errors: Partial<Record<ActionKey, string>>;
}

interface JobAssetsState {
  logs: LogEntry[];
  artifacts: Artifact[];
  error: string | null;
  isLoading: boolean;
}

interface SettingsFormState {
  introMinWords: string;
  introMaxWords: string;
  introMaxAttempts: string;
  seoMetaDescriptionMaxChars: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiHealthy(health: HealthResponse | null, error: string | null): boolean {
  if (error) {
    return false;
  }

  if (!health) {
    return true;
  }

  if (health.ok === false) {
    return false;
  }

  const status = typeof health.status === "string" ? health.status.toLowerCase() : "";
  return !["error", "failed", "down", "unhealthy"].includes(status);
}

function getErrorHint(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Run prepare first, then refresh this stage.";
    }

    if (error.status === 409) {
      return `Blocked: ${error.message}`;
    }

    if (error.status === 422) {
      return `Invalid input: ${error.message}`;
    }
  }

  return getApiErrorMessage(error) || fallback;
}

function formatOptional(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.join(" > ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : formatOptional(item)))
    .filter((item) => item.trim().length > 0 && item !== "-");
}

function getJobModel(job: Job): string | undefined {
  if (typeof job.model === "string") {
    return job.model;
  }

  const payload = getRequestPayload(job);
  if (isRecord(payload) && typeof payload.model === "string") {
    return payload.model;
  }

  return undefined;
}

function getJobMessage(job: Job): string | null {
  for (const value of [job.message, job.error, job.detail]) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (isRecord(value)) {
      for (const key of ["message", "detail", "error"]) {
        const nestedValue = value[key];
        if (typeof nestedValue === "string" && nestedValue.trim().length > 0) {
          return nestedValue;
        }
      }
    }
  }

  return null;
}

function getLatestJobForStage(jobs: Job[], stage: WorkflowType, model: string): Job | null {
  const normalizedModel = model.trim().toLowerCase();
  if (!normalizedModel) {
    return null;
  }

  return (
    jobs
      .filter((job) => getJobStage(job) === stage)
      .filter((job) => (getJobModel(job) ?? "").trim().toLowerCase() === normalizedModel)
      .sort(compareJobsByUpdatedDesc)[0] ?? null
  );
}

function getTaskStatus(task: AuthoringTaskStatus | null | undefined): string {
  return task?.status && task.status.trim().length > 0 ? task.status : "not loaded";
}

function getStageStatus(status: string | null | undefined, fallback = "not loaded"): string {
  return status && status.trim().length > 0 ? status : fallback;
}

function getGroupWarnings(group: FilterReviewGroup): string[] {
  const warnings: string[] = [];
  if (group.missing_required) {
    warnings.push("Missing required");
  }
  if (group.outside_allowed) {
    warnings.push("Outside allowed");
  }
  if (group.deprecated_value) {
    warnings.push("Deprecated");
  }
  if (group.inactive_group) {
    warnings.push("Inactive group");
  }
  if (group.emitted_if_rendered === false) {
    warnings.push("Not emitted");
  }
  return warnings;
}

function allowedValueLabel(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (isRecord(value)) {
    for (const key of ["label", "name", "value", "id"]) {
      const item = value[key];
      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }
    }
  }

  return "";
}

function makeSettingsForm(settings: ProductAgentSettings | null): SettingsFormState {
  const introDefaults = settings?.authoring?.intro_text?.default;
  const seoDefaults = settings?.authoring?.seo_meta?.default;
  return {
    introMinWords: formatOptional(introDefaults?.min_words).replace("-", ""),
    introMaxWords: formatOptional(introDefaults?.max_words).replace("-", ""),
    introMaxAttempts: formatOptional(introDefaults?.max_attempts).replace("-", ""),
    seoMetaDescriptionMaxChars: formatOptional(seoDefaults?.meta_description_max_chars).replace("-", ""),
  };
}

function parseSettingsNumber(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) ? parsed : null;
}

function makeSettingsPayload(form: SettingsFormState): {
  payload: ProductAgentSettings | null;
  error: string | null;
} {
  const minWords = parseSettingsNumber(form.introMinWords);
  const maxWords = parseSettingsNumber(form.introMaxWords);
  const maxAttempts = parseSettingsNumber(form.introMaxAttempts);
  const seoMaxChars = parseSettingsNumber(form.seoMetaDescriptionMaxChars);

  if (minWords === null || minWords <= 0) {
    return { payload: null, error: "Intro min words must be greater than 0." };
  }

  if (maxWords === null || maxWords < minWords || maxWords > 500) {
    return { payload: null, error: "Intro max words must be at least min words and no more than 500." };
  }

  if (maxAttempts === null || maxAttempts < 1 || maxAttempts > 10) {
    return { payload: null, error: "Intro max attempts must be between 1 and 10." };
  }

  if (seoMaxChars === null || seoMaxChars <= 0) {
    return { payload: null, error: "SEO meta description max chars must be a positive whole number." };
  }

  return {
    payload: {
      authoring: {
        intro_text: {
          default: {
            min_words: minWords,
            max_words: maxWords,
            max_attempts: maxAttempts,
          },
        },
        seo_meta: {
          default: {
            meta_description_max_chars: seoMaxChars,
          },
        },
      },
    },
    error: null,
  };
}

function WorkflowStage({
  title,
  status,
  description,
  children,
}: {
  title: string;
  status: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel workflow-stage">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stage</p>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </section>
  );
}

function MessageBlock({ message, error }: { message?: string; error?: string }) {
  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (message) {
    return <p className="state-block">{message}</p>;
  }

  return null;
}

function BlockingReasons({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) {
    return null;
  }

  return (
    <div className="form-warning">
      <strong>Blocking reasons</strong>
      <ul>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}

function PathValue({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div>
      <dt>{label}</dt>
      <dd>{formatOptional(value)}</dd>
    </div>
  );
}

function AuthoringTaskCard({
  title,
  task,
  onRun,
  onRetry,
  isRunBusy,
  isRetryBusy,
  runLabel,
  retryLabel,
  disabled,
}: {
  title: string;
  task: AuthoringTaskStatus | null | undefined;
  onRun: () => void;
  onRetry: () => void;
  isRunBusy: boolean;
  isRetryBusy: boolean;
  runLabel: string;
  retryLabel: string;
  disabled: boolean;
}) {
  const errors = toStringList(task?.errors);
  return (
    <div className="stage-card">
      <div className="section-heading">
        <div>
          <h4>{title}</h4>
          <StatusBadge status={getTaskStatus(task)} />
        </div>
        <div className="button-row">
          <button className="button primary compact-button" type="button" disabled={disabled || isRunBusy} onClick={onRun}>
            {isRunBusy ? "Running..." : runLabel}
          </button>
          <button className="button secondary compact-button" type="button" disabled={disabled || isRetryBusy} onClick={onRetry}>
            {isRetryBusy ? "Retrying..." : retryLabel}
          </button>
        </div>
      </div>

      <dl className="summary-grid workflow-summary-grid">
        <PathValue label="Word count" value={task?.word_count} />
        <PathValue label="Min words" value={task?.min_words} />
        <PathValue label="Max words" value={task?.max_words} />
        <PathValue label="Max attempts" value={task?.max_attempts} />
        <PathValue label="Output path" value={task?.output_path} />
        <PathValue label="Trace path" value={task?.trace_path} />
      </dl>

      {errors.length > 0 ? (
        <div className="form-error">
          <strong>Validation errors</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function JobAssets({ jobId, isJobActive }: { jobId: string; isJobActive: boolean }) {
  const [assets, setAssets] = useState<JobAssetsState>({
    logs: [],
    artifacts: [],
    error: null,
    isLoading: true,
  });

  const loadAssets = useCallback(
    async (signal?: AbortSignal) => {
      setAssets((current) => ({ ...current, isLoading: true }));
      try {
        const [logs, artifacts] = await Promise.all([
          apiClient.getJobLogs(jobId, signal),
          apiClient.getJobArtifacts(jobId, signal),
        ]);
        if (signal?.aborted) {
          return;
        }

        setAssets({ logs, artifacts, error: null, isLoading: false });
      } catch (error) {
        if (!signal?.aborted) {
          setAssets((current) => ({
            ...current,
            error: getApiErrorMessage(error),
            isLoading: false,
          }));
        }
      }
    },
    [jobId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadAssets(controller.signal);
    return () => controller.abort();
  }, [loadAssets]);

  useEffect(() => {
    if (!isJobActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadAssets();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isJobActive, loadAssets]);

  return (
    <div className="stage-job-assets">
      {assets.isLoading ? <p className="muted">Loading job logs and artifacts...</p> : null}
      {assets.error ? <ErrorState message={assets.error} onRetry={() => void loadAssets()} /> : null}
      <details>
        <summary>Logs ({assets.logs.length})</summary>
        <LogsPanel logs={assets.logs} />
      </details>
      <details>
        <summary>Artifacts ({assets.artifacts.length})</summary>
        <ArtifactList artifacts={assets.artifacts} />
      </details>
    </div>
  );
}

function StageJobPanel({ job, label }: { job: Job | null; label: string }) {
  const jobId = job ? getJobIdentifier(job) : undefined;
  if (!job || !jobId) {
    return <EmptyState title={`No ${label} job for this model`} message="Run this stage to create one." />;
  }

  const message = getJobMessage(job);
  return (
    <div className="stage-job-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Latest {label} job</p>
          <h4>
            <Link to={`/jobs/${encodeURIComponent(jobId)}`}>{jobId}</Link>
          </h4>
        </div>
        <StatusBadge status={getJobStatus(job)} />
      </div>
      {message ? <p className="muted">{message}</p> : null}
      <JobAssets jobId={jobId} isJobActive={isActiveJob(job)} />
    </div>
  );
}

function SettingsPanel({
  disabled,
  state,
  setActionState,
}: {
  disabled: boolean;
  state: StageActionState;
  setActionState: React.Dispatch<React.SetStateAction<StageActionState>>;
}) {
  const [settings, setSettings] = useState<ProductAgentSettings | null>(null);
  const [form, setForm] = useState<SettingsFormState>(makeSettingsForm(null));
  const [localError, setLocalError] = useState<string | null>(null);

  const loadSettings = useCallback(
    async (signal?: AbortSignal) => {
      setActionState((current) => ({
        ...current,
        busy: { ...current.busy, settings_load: true },
        errors: { ...current.errors, settings_load: undefined },
      }));
      try {
        const nextSettings = await apiClient.getSettings(signal);
        if (signal?.aborted) {
          return;
        }
        setSettings(nextSettings);
        setForm(makeSettingsForm(nextSettings));
        setActionState((current) => ({
          ...current,
          messages: { ...current.messages, settings_load: "Settings loaded." },
        }));
      } catch (error) {
        if (!signal?.aborted) {
          setActionState((current) => ({
            ...current,
            errors: { ...current.errors, settings_load: getErrorHint(error, "Could not load settings.") },
          }));
        }
      } finally {
        if (!signal?.aborted) {
          setActionState((current) => ({
            ...current,
            busy: { ...current.busy, settings_load: false },
          }));
        }
      }
    },
    [setActionState],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadSettings(controller.signal);
    return () => controller.abort();
  }, [loadSettings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { payload, error } = makeSettingsPayload(form);
    setLocalError(error);
    if (!payload) {
      return;
    }

    setActionState((current) => ({
      ...current,
      busy: { ...current.busy, settings_save: true },
      errors: { ...current.errors, settings_save: undefined },
      messages: { ...current.messages, settings_save: undefined },
    }));

    try {
      const nextSettings = await apiClient.patchSettings(payload);
      setSettings(nextSettings);
      setForm(makeSettingsForm(nextSettings));
      setActionState((current) => ({
        ...current,
        messages: { ...current.messages, settings_save: "Settings saved." },
      }));
    } catch (errorValue) {
      setActionState((current) => ({
        ...current,
        errors: { ...current.errors, settings_save: getErrorHint(errorValue, "Could not save settings.") },
      }));
    } finally {
      setActionState((current) => ({
        ...current,
        busy: { ...current.busy, settings_save: false },
      }));
    }
  }

  function updateField(key: keyof SettingsFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h3>Authoring defaults</h3>
          <p className="muted">Compact defaults only; category and source-specific settings stay hidden here.</p>
        </div>
        <button
          className="button secondary compact-button"
          type="button"
          disabled={disabled || state.busy.settings_load}
          onClick={() => void loadSettings()}
        >
          {state.busy.settings_load ? "Loading..." : "Load settings"}
        </button>
      </div>

      <form className="form settings-mini-form" onSubmit={handleSubmit}>
        {(localError ?? state.errors.settings_save ?? state.errors.settings_load) ? (
          <div className="form-error">{localError ?? state.errors.settings_save ?? state.errors.settings_load}</div>
        ) : null}
        {state.messages.settings_save ? <p className="state-block">{state.messages.settings_save}</p> : null}

        <div className="filter-grid">
          <label>
            <span>Intro min words</span>
            <input
              inputMode="numeric"
              type="number"
              min="1"
              value={form.introMinWords}
              onChange={(event) => updateField("introMinWords", event.target.value)}
            />
          </label>
          <label>
            <span>Intro max words</span>
            <input
              inputMode="numeric"
              type="number"
              min="1"
              max="500"
              value={form.introMaxWords}
              onChange={(event) => updateField("introMaxWords", event.target.value)}
            />
          </label>
          <label>
            <span>Intro max attempts</span>
            <input
              inputMode="numeric"
              type="number"
              min="1"
              max="10"
              value={form.introMaxAttempts}
              onChange={(event) => updateField("introMaxAttempts", event.target.value)}
            />
          </label>
          <label>
            <span>SEO meta max chars</span>
            <input
              inputMode="numeric"
              type="number"
              min="1"
              value={form.seoMetaDescriptionMaxChars}
              onChange={(event) => updateField("seoMetaDescriptionMaxChars", event.target.value)}
            />
          </label>
        </div>

        <button className="button primary inline-button" type="submit" disabled={disabled || state.busy.settings_save || !settings}>
          {state.busy.settings_save ? "Saving..." : "Save settings"}
        </button>
      </form>
    </section>
  );
}

export function ProductAgentWorkflowPage() {
  const { jobs, reload, trackJob } = useGlobalJobs();
  const [form, setForm, resetForm] = usePersistentPageState<PrepareFormState>(
    WORKFLOW_STORAGE_KEY,
    initialPrepareFormState,
  );
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [authoringStatus, setAuthoringStatus] = useState<AuthoringStatus | null>(null);
  const [filterReview, setFilterReview] = useState<FilterReview | null>(null);
  const [renderOverride, setRenderOverride] = useState(false);
  const [resetSeq, setResetSeq] = useState(0);
  const [actionState, setActionState] = useState<StageActionState>({
    busy: {},
    messages: {},
    errors: {},
  });

  const model = form.model.trim();
  const isBackendAvailable = isApiHealthy(health, healthError);
  const latestPrepareJob = useMemo(() => getLatestJobForStage(jobs, "prepare", model), [jobs, model]);
  const latestRenderJob = useMemo(() => getLatestJobForStage(jobs, "render", model), [jobs, model]);
  const latestPublishJob = useMemo(() => getLatestJobForStage(jobs, "publish", model), [jobs, model]);

  const authoringBlockReasons = toStringList(authoringStatus?.render_block_reasons);
  const filterBlockReasons = toStringList(filterReview?.render_block_reasons);
  const renderBlockReasons = [...authoringBlockReasons, ...filterBlockReasons];
  const renderBlocked =
    authoringStatus?.ready_for_render === false ||
    filterReview?.render_blocked === true ||
    renderBlockReasons.length > 0;

  const loadHealth = useCallback(async (signal?: AbortSignal) => {
    setIsHealthLoading(true);
    try {
      const nextHealth = await apiClient.getHealth(signal);
      if (signal?.aborted) {
        return;
      }
      setHealth(nextHealth);
      setHealthError(null);
    } catch (error) {
      if (!signal?.aborted) {
        setHealth(null);
        setHealthError(getApiErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) {
        setIsHealthLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHealth(controller.signal);
    return () => controller.abort();
  }, [loadHealth]);

  const runAction = useCallback(
    async (
      key: ActionKey,
      action: () => Promise<void>,
      successMessage: string,
      fallbackError: string,
    ) => {
      setActionState((current) => ({
        ...current,
        busy: { ...current.busy, [key]: true },
        errors: { ...current.errors, [key]: undefined },
        messages: { ...current.messages, [key]: undefined },
      }));

      try {
        await action();
        setActionState((current) => ({
          ...current,
          messages: { ...current.messages, [key]: successMessage },
        }));
      } catch (error) {
        setActionState((current) => ({
          ...current,
          errors: { ...current.errors, [key]: getErrorHint(error, fallbackError) },
        }));
      } finally {
        setActionState((current) => ({
          ...current,
          busy: { ...current.busy, [key]: false },
        }));
      }
    },
    [],
  );

  const loadAuthoring = useCallback(
    async (actionKey: ActionKey = "authoring_load") => {
      if (!model) {
        setActionState((current) => ({
          ...current,
          errors: { ...current.errors, [actionKey]: "Model is required." },
        }));
        return;
      }

      await runAction(
        actionKey,
        async () => {
          setAuthoringStatus(await apiClient.getAuthoringStatus(model));
        },
        "Authoring status loaded.",
        "Could not load authoring status.",
      );
    },
    [model, runAction],
  );

  const loadFilterReview = useCallback(
    async (actionKey: ActionKey = "filter_load") => {
      if (!model) {
        setActionState((current) => ({
          ...current,
          errors: { ...current.errors, [actionKey]: "Model is required." },
        }));
        return;
      }

      await runAction(
        actionKey,
        async () => {
          setFilterReview(await apiClient.getFilterReview(model));
        },
        "Filter review loaded.",
        "Could not load filter review.",
      );
    },
    [model, runAction],
  );

  async function handlePrepareSubmit(request: PrepareJobRequest) {
    await runAction(
      "prepare",
      async () => {
        const job = await apiClient.createPrepareJob(request);
        trackJob(job);
        await reload();
      },
      "Prepare job started.",
      "Could not start prepare job.",
    );
  }

  async function handleRender() {
    if (!model) {
      setActionState((current) => ({
        ...current,
        errors: { ...current.errors, render: "Model is required." },
      }));
      return;
    }

    await runAction(
      "render",
      async () => {
        const job = await apiClient.createRenderJob({ model });
        trackJob(job);
        await reload();
      },
      "Render job started.",
      "Could not start render job.",
    );
  }

  async function handlePublish() {
    if (!model) {
      setActionState((current) => ({
        ...current,
        errors: { ...current.errors, publish: "Model is required." },
      }));
      return;
    }

    await runAction(
      "publish",
      async () => {
        const job = await apiClient.createPublishJob({ model });
        trackJob(job);
        await reload();
      },
      "Publish job started.",
      "Could not start publish job.",
    );
  }

  async function handleSaveFilterReview() {
    if (!model || !filterReview) {
      setActionState((current) => ({
        ...current,
        errors: { ...current.errors, filter_save: "Load filter review before saving." },
      }));
      return;
    }

    await runAction(
      "filter_save",
      async () => {
        await apiClient.saveFilterReview(model, filterReview);
        setFilterReview(await apiClient.getFilterReview(model));
      },
      "Filter review saved.",
      "Could not save filter review.",
    );
  }

  async function handleApproveFilterReview() {
    if (!model) {
      setActionState((current) => ({
        ...current,
        errors: { ...current.errors, filter_approve: "Model is required." },
      }));
      return;
    }

    await runAction(
      "filter_approve",
      async () => {
        await apiClient.approveFilterReview(model);
        setFilterReview(await apiClient.getFilterReview(model));
      },
      "Filter review approval requested.",
      "Could not approve filter review.",
    );
  }

  function updateReviewedValue(index: number, value: string) {
    setFilterReview((current) => {
      if (!current) {
        return current;
      }

      const groups = [...(current.groups ?? [])];
      groups[index] = { ...groups[index], reviewed_value: value };
      return { ...current, groups };
    });
  }

  function handleResetForm() {
    resetForm();
    setAuthoringStatus(null);
    setFilterReview(null);
    setRenderOverride(false);
    setResetSeq((current) => current + 1);
    setActionState({ busy: {}, messages: {}, errors: {} });
  }

  const writeDisabled = !isBackendAvailable || isHealthLoading;
  const modelRequiredDisabled = writeDisabled || model.length === 0;
  const renderDisabled = modelRequiredDisabled || (renderBlocked && !renderOverride);

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Product-Agent</p>
        <h2>Workflow shell</h2>
        <p>{"Prepare -> Authoring -> Filter Review -> Render -> Publish"}</p>
        <button className="text-button" type="button" onClick={handleResetForm}>
          Reset saved Workflow state
        </button>
      </section>

      <section className={`db-status-banner ${isBackendAvailable ? "ok" : "danger"}`}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">API health</p>
            <h3>{isHealthLoading ? "Checking Product-Agent API" : isBackendAvailable ? "Product-Agent API available" : "Product-Agent API unavailable"}</h3>
          </div>
          <button className="button secondary compact-button" type="button" onClick={() => void loadHealth()}>
            Retry health
          </button>
        </div>
        {healthError ? <p className="form-error">{healthError}</p> : null}
        {!isBackendAvailable ? <p className="muted">Write actions are disabled until the backend health check succeeds.</p> : null}
      </section>

      <WorkflowStage
        title="Prepare"
        status={latestPrepareJob ? getJobStatus(latestPrepareJob) : "pending"}
        description="Collect source input and queue the existing prepare job endpoint."
      >
        <PrepareJobForm
          key={resetSeq}
          actionLabel="Run Prepare"
          busyLabel={writeDisabled ? "Backend unavailable" : "Starting prepare..."}
          error={actionState.errors.prepare ?? null}
          isSubmitting={Boolean(actionState.busy.prepare) || writeDisabled}
          initialForm={form}
          onFormChange={setForm}
          onSubmit={(request) => void handlePrepareSubmit(request)}
        />
        <MessageBlock message={actionState.messages.prepare} error={actionState.errors.prepare} />
        <StageJobPanel job={latestPrepareJob} label="prepare" />
      </WorkflowStage>

      <WorkflowStage
        title="Authoring"
        status={authoringStatus ? (authoringStatus.ready_for_render ? "ready" : "blocked") : "not loaded"}
        description="Load authoring state, run intro text, and run SEO metadata separately."
      >
        <div className="button-row">
          <button className="button secondary" type="button" disabled={modelRequiredDisabled || actionState.busy.authoring_load} onClick={() => void loadAuthoring()}>
            {actionState.busy.authoring_load ? "Loading..." : "Refresh Authoring"}
          </button>
        </div>
        <MessageBlock message={actionState.messages.authoring_load} error={actionState.errors.authoring_load} />
        {model.length === 0 ? <p className="form-warning">Enter a model before loading authoring status.</p> : null}

        <div className="split-grid">
          <AuthoringTaskCard
            title="Intro Text"
            task={authoringStatus?.intro_text}
            onRun={() =>
              void runAction(
                "intro_run",
                async () => {
                  await apiClient.runIntroText(model);
                  await loadAuthoring("intro_run");
                },
                "Intro text run completed.",
                "Could not run intro text.",
              )
            }
            onRetry={() =>
              void runAction(
                "intro_retry",
                async () => {
                  await apiClient.retryIntroText(model);
                  await loadAuthoring("intro_retry");
                },
                "Intro text retry completed.",
                "Could not retry intro text.",
              )
            }
            isRunBusy={Boolean(actionState.busy.intro_run)}
            isRetryBusy={Boolean(actionState.busy.intro_retry)}
            runLabel="Run Intro Text"
            retryLabel="Retry Intro Text"
            disabled={modelRequiredDisabled}
          />
          <AuthoringTaskCard
            title="SEO Meta"
            task={authoringStatus?.seo_meta}
            onRun={() =>
              void runAction(
                "seo_run",
                async () => {
                  await apiClient.runSeoMeta(model);
                  await loadAuthoring("seo_run");
                },
                "SEO meta run completed.",
                "Could not run SEO meta.",
              )
            }
            onRetry={() =>
              void runAction(
                "seo_retry",
                async () => {
                  await apiClient.retrySeoMeta(model);
                  await loadAuthoring("seo_retry");
                },
                "SEO meta retry completed.",
                "Could not retry SEO meta.",
              )
            }
            isRunBusy={Boolean(actionState.busy.seo_run)}
            isRetryBusy={Boolean(actionState.busy.seo_retry)}
            runLabel="Run SEO Meta"
            retryLabel="Retry SEO Meta"
            disabled={modelRequiredDisabled}
          />
        </div>
        <MessageBlock error={actionState.errors.intro_run ?? actionState.errors.intro_retry ?? actionState.errors.seo_run ?? actionState.errors.seo_retry} />
        {authoringStatus ? (
          <>
            <dl className="summary-grid workflow-summary-grid">
              <PathValue label="Ready for render" value={authoringStatus.ready_for_render} />
              <PathValue label="Model" value={authoringStatus.model} />
            </dl>
            <BlockingReasons reasons={authoringBlockReasons} />
            {toStringList(authoringStatus.warnings).length > 0 ? (
              <p className="form-warning">{toStringList(authoringStatus.warnings).join("; ")}</p>
            ) : null}
          </>
        ) : null}
      </WorkflowStage>

      <WorkflowStage
        title="Filter Review"
        status={filterReview ? (filterReview.approved ? "approved" : filterReview.render_blocked ? "blocked" : "loaded") : "not loaded"}
        description="Review product-specific filter values before render."
      >
        <div className="button-row">
          <button className="button secondary" type="button" disabled={modelRequiredDisabled || actionState.busy.filter_load} onClick={() => void loadFilterReview()}>
            {actionState.busy.filter_load ? "Loading..." : "Load Filter Review"}
          </button>
          <button className="button primary" type="button" disabled={modelRequiredDisabled || !filterReview || actionState.busy.filter_save} onClick={() => void handleSaveFilterReview()}>
            {actionState.busy.filter_save ? "Saving..." : "Save Filter Review"}
          </button>
          <button className="button secondary" type="button" disabled={modelRequiredDisabled || !filterReview || actionState.busy.filter_approve} onClick={() => void handleApproveFilterReview()}>
            {actionState.busy.filter_approve ? "Approving..." : "Approve Filter Review"}
          </button>
        </div>
        <MessageBlock
          message={actionState.messages.filter_load ?? actionState.messages.filter_save ?? actionState.messages.filter_approve}
          error={actionState.errors.filter_load ?? actionState.errors.filter_save ?? actionState.errors.filter_approve}
        />

        {filterReview ? (
          <>
            <dl className="summary-grid workflow-summary-grid">
              <PathValue label="Category path" value={filterReview.taxonomy_path} />
              <PathValue label="Category ID" value={filterReview.category_id} />
              <PathValue label="Filter category found" value={filterReview.filter_category_found} />
              <PathValue label="Approved" value={filterReview.approved} />
              <PathValue label="Approved at" value={filterReview.approved_at} />
              <PathValue label="Render blocked" value={filterReview.render_blocked} />
              <PathValue label="Review artifact" value={filterReview.review_artifact_path} />
            </dl>
            <BlockingReasons reasons={filterBlockReasons} />
            {toStringList(filterReview.missing_required_groups).length > 0 ? (
              <div className="form-error">
                <strong>Missing required groups</strong>
                <ul>
                  {toStringList(filterReview.missing_required_groups).map((group) => (
                    <li key={group}>{group}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {toStringList(filterReview.warnings).length > 0 ? <p className="form-warning">{toStringList(filterReview.warnings).join("; ")}</p> : null}
            <div className="table-wrap filter-review-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Required</th>
                    <th>Group</th>
                    <th>Status</th>
                    <th>Resolved value</th>
                    <th>Reviewed value input</th>
                    <th>Effective value</th>
                    <th>Source</th>
                    <th>Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {(filterReview.groups ?? []).map((group, index) => {
                    const warnings = getGroupWarnings(group);
                    const inputClass = group.missing_required ? "table-input missing-required-input" : "table-input";
                    return (
                      <tr key={`${formatOptional(group.group_id)}-${index}`}>
                        <td>{group.required ? <span className="status-badge warning">Required</span> : <span className="status-badge neutral">Optional</span>}</td>
                        <td>
                          <strong>{formatOptional(group.group_name)}</strong>
                          <span className="artifact-path">{formatOptional(group.group_id)}</span>
                        </td>
                        <td>{formatOptional(group.status)}</td>
                        <td>{formatOptional(group.resolved_value)}</td>
                        <td>
                          <input
                            className={inputClass}
                            list={`filter-review-values-${index}`}
                            value={group.reviewed_value ?? ""}
                            onChange={(event) => updateReviewedValue(index, event.target.value)}
                            placeholder={group.missing_required ? "Required value" : "Reviewed value"}
                          />
                          {Array.isArray(group.allowed_values) ? (
                            <datalist id={`filter-review-values-${index}`}>
                              {group.allowed_values
                                .map(allowedValueLabel)
                                .filter(Boolean)
                                .map((value) => (
                                  <option key={value} value={value} />
                                ))}
                            </datalist>
                          ) : null}
                        </td>
                        <td>
                          {formatOptional(group.effective_value)}
                          <span className="artifact-path">{formatOptional(group.effective_value_id)}</span>
                          <span className="artifact-path">{formatOptional(group.value_status)}</span>
                        </td>
                        <td>{formatOptional(group.source)}</td>
                        <td>{warnings.length > 0 ? warnings.join("; ") : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState title="No filter review loaded" message="Load filter review after prepare has produced product artifacts." />
        )}
      </WorkflowStage>

      <WorkflowStage
        title="Render"
        status={latestRenderJob ? getJobStatus(latestRenderJob) : renderBlocked ? "blocked" : "pending"}
        description="Queue render only after authoring and filter review blockers are clear."
      >
        <BlockingReasons reasons={renderBlockReasons} />
        {renderBlocked ? (
          <label className="checkbox-row workflow-checkbox-row">
            <input type="checkbox" checked={renderOverride} onChange={(event) => setRenderOverride(event.target.checked)} />
            <span>Allow render despite known blockers</span>
          </label>
        ) : null}
        <div className="button-row">
          <button className="button primary" type="button" disabled={renderDisabled || actionState.busy.render} onClick={() => void handleRender()}>
            {actionState.busy.render ? "Starting render..." : "Render"}
          </button>
          {renderDisabled ? <span className="muted">Render requires model, backend health, and no known blockers unless override is checked.</span> : null}
        </div>
        <MessageBlock message={actionState.messages.render} error={actionState.errors.render} />
        <StageJobPanel job={latestRenderJob} label="render" />
      </WorkflowStage>

      <WorkflowStage
        title="Publish"
        status={latestPublishJob ? getJobStatus(latestPublishJob) : "pending"}
        description="Queue publish as a separate operator action after render."
      >
        <div className="button-row">
          <button className="button primary" type="button" disabled={modelRequiredDisabled || actionState.busy.publish} onClick={() => void handlePublish()}>
            {actionState.busy.publish ? "Starting publish..." : "Publish"}
          </button>
          {modelRequiredDisabled ? <span className="muted">Publish requires model and backend health.</span> : null}
        </div>
        <MessageBlock message={actionState.messages.publish} error={actionState.errors.publish} />
        <StageJobPanel job={latestPublishJob} label="publish" />
      </WorkflowStage>

      <SettingsPanel disabled={writeDisabled} state={actionState} setActionState={setActionState} />

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Execution history</p>
            <h3>Latest jobs for {model || "selected model"}</h3>
          </div>
          <Link className="button secondary compact-button" to="/jobs">
            Open Jobs
          </Link>
        </div>
        <div className="pipeline-stage-list">
          {(["prepare", "render", "publish"] as WorkflowType[]).map((stage) => {
            const job = stage === "prepare" ? latestPrepareJob : stage === "render" ? latestRenderJob : latestPublishJob;
            const jobId = job ? getJobIdentifier(job) : undefined;
            return (
              <div className="pipeline-stage-item" key={stage}>
                <div className="pipeline-stage-main">
                  <strong>{stage}</strong>
                  {jobId ? <Link to={`/jobs/${encodeURIComponent(jobId)}`}>{jobId}</Link> : <span className="muted">No job found</span>}
                </div>
                <StatusBadge status={job ? getJobStatus(job) : "pending"} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
