import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommerceApiError,
  commerceClient,
  getCommerceApiErrorMessage,
} from "../api/commerceClient";
import type {
  ApplyPriceMonitoringReviewActionsResult,
  ExportPriceMonitoringPriceUpdateResult,
  FetchPriceMonitoringResult,
  MarketplaceFilter,
  PriceMonitoringAction,
  PriceMonitoringReviewAction,
  PriceMonitoringReviewItem,
  PriceMonitoringReviewResponse,
  PriceMonitoringRun,
  PriceMonitoringSelectionBody,
  PriceMonitoringSelectionItem,
  PriceMonitoringSelectionResult,
  PriceMonitoringSource,
} from "../api/commerceTypes";
import { EmptyState, ErrorState, LoadingState } from "../components/layout/StateBlocks";

type SourceOverride = "" | PriceMonitoringSource;

interface RowActionState {
  selected_action: "" | PriceMonitoringAction;
  undercut_amount: string;
  reason: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseModelText(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
}

function isAction(value: unknown): value is PriceMonitoringAction {
  return value === "match_price" || value === "undercut" || value === "ignore";
}

function makeSelectionBody({
  source,
  q,
  category,
  manufacturer,
  marketplace,
  selectedModelText,
  excludedModelText,
  includeIgnored,
  automationEligibleOnly,
  atomicOnly,
  hasMpn,
  dryRun,
}: {
  source: PriceMonitoringSource;
  q: string;
  category: string;
  manufacturer: string;
  marketplace: MarketplaceFilter;
  selectedModelText: string;
  excludedModelText: string;
  includeIgnored: boolean;
  automationEligibleOnly: boolean;
  atomicOnly: boolean;
  hasMpn: boolean;
  dryRun: boolean;
}): PriceMonitoringSelectionBody {
  const trimmedQ = q.trim();

  return {
    source,
    filters: {
      q: trimmedQ.length > 0 ? trimmedQ : null,
      category: category || null,
      manufacturer: manufacturer || null,
      marketplace: marketplace === "all" ? null : marketplace,
      has_mpn: hasMpn,
      atomic_only: atomicOnly,
      automation_eligible_only: automationEligibleOnly,
    },
    selected_models: parseModelText(selectedModelText),
    excluded_models: parseModelText(excludedModelText),
    include_ignored: includeIgnored,
    dry_run: dryRun,
  };
}

function getRunId(run: PriceMonitoringRun | PriceMonitoringSelectionResult | null): string {
  const value = run && ("run_id" in run ? run.run_id : null);
  return value === null || value === undefined ? "" : String(value);
}

function getSelectedItems(result: PriceMonitoringSelectionResult): PriceMonitoringSelectionItem[] {
  return result.selected_items ?? result.selected ?? [];
}

function getActionState(
  row: PriceMonitoringReviewItem,
  actionState: Record<string, RowActionState>,
): RowActionState {
  return (
    actionState[row.model] ?? {
      selected_action: isAction(row.selected_action) ? row.selected_action : "",
      undercut_amount:
        typeof row.undercut_amount === "number" && Number.isFinite(row.undercut_amount)
          ? String(row.undercut_amount)
          : "",
      reason: "",
    }
  );
}

function computeTargetPrice(row: PriceMonitoringReviewItem, state: RowActionState): number | null {
  if (state.selected_action === "match_price") {
    return typeof row.competitor_price === "number" ? row.competitor_price : null;
  }

  if (state.selected_action === "undercut") {
    const undercutAmount = Number(state.undercut_amount);
    return typeof row.competitor_price === "number" &&
      Number.isFinite(row.competitor_price) &&
      Number.isFinite(undercutAmount)
      ? row.competitor_price - undercutAmount
      : null;
  }

  return typeof row.target_price === "number" ? row.target_price : null;
}

function getActionError(row: PriceMonitoringReviewItem, state: RowActionState): string | null {
  if (state.selected_action === "") {
    return null;
  }

  if (state.selected_action === "ignore") {
    return null;
  }

  if (typeof row.competitor_price !== "number" || !Number.isFinite(row.competitor_price)) {
    return "Competitor price is required.";
  }

  if (state.selected_action === "undercut") {
    const undercutAmount = Number(state.undercut_amount);
    if (!Number.isFinite(undercutAmount) || undercutAmount <= 0) {
      return "Undercut amount must be greater than 0.";
    }
  }

  return null;
}

function SelectionResultBlock({ result }: { result: PriceMonitoringSelectionResult }) {
  const selectedItems = getSelectedItems(result);

  return (
    <div className="state-block">
      <strong>Selection result</strong>
      <dl className="summary-grid">
        <SummaryItem label="Run ID" value={result.run_id} />
        <SummaryItem label="Status" value={result.status} />
        <SummaryItem label="Source" value={result.source} />
        <SummaryItem label="Output dir" value={result.output_dir} />
        <SummaryItem label="Input CSV" value={result.input_csv_path} />
        <SummaryItem label="Selection summary" value={result.selection_summary_path} />
        <SummaryItem label="Selected" value={result.selected_count} />
        <SummaryItem label="Skipped" value={result.skipped_count} />
      </dl>

      {result.skipped_by_reason ? (
        <div className="compact-list">
          <strong>Skipped by reason</strong>
          <ul>
            {Object.entries(result.skipped_by_reason).map(([reason, count]) => (
              <li key={reason}>
                {reason}: {count}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selectedItems.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Name</th>
                <th>MPN</th>
                <th>Category</th>
                <th>Manufacturer</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.slice(0, 25).map((item, index) => (
                <tr key={`${item.model ?? "item"}-${index}`}>
                  <td>{formatValue(item.model)}</td>
                  <td>{formatValue(item.name)}</td>
                  <td>{formatValue(item.mpn)}</td>
                  <td>{formatValue(item.category)}</td>
                  <td>{formatValue(item.manufacturer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedItems.length > 25 ? (
            <p className="muted">Showing 25 of {selectedItems.length} returned selected items.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RunSummaryBlock({ run }: { run: PriceMonitoringRun | PriceMonitoringSelectionResult }) {
  return (
    <div className="state-block">
      <strong>Current run</strong>
      <dl className="summary-grid">
        <SummaryItem label="Run ID" value={getRunId(run)} />
        <SummaryItem label="Status" value={run.status} />
        <SummaryItem label="Source" value={run.source} />
        <SummaryItem label="Output dir" value={run.output_dir} />
        <SummaryItem label="Input CSV" value={run.input_csv_path} />
        <SummaryItem label="Selection summary" value={run.selection_summary_path} />
        <SummaryItem label="Selected" value={run.selected_count} />
        <SummaryItem label="Skipped" value={run.skipped_count} />
      </dl>
      {run.skipped_by_reason ? (
        <div className="compact-list">
          <strong>Skipped by reason</strong>
          <ul>
            {Object.entries(run.skipped_by_reason).map(([reason, count]) => (
              <li key={reason}>
                {reason}: {count}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FetchResultBlock({ result }: { result: FetchPriceMonitoringResult }) {
  return (
    <div className="state-block">
      <strong>Fetch result</strong>
      <dl className="summary-grid">
        <SummaryItem label="Status" value={result.status} />
        <SummaryItem label="Source" value={result.source} />
        <SummaryItem label="Input CSV" value={result.input_csv_path} />
        <SummaryItem label="Enriched CSV" value={result.enriched_csv_path} />
        <SummaryItem label="Fetch summary" value={result.fetch_summary_path} />
        <SummaryItem label="Fetch result" value={result.fetch_result_path} />
        <SummaryItem label="Started" value={result.started_at} />
        <SummaryItem label="Completed" value={result.completed_at} />
      </dl>
      {result.warnings && result.warnings.length > 0 ? (
        <div className="compact-list">
          <strong>Warnings</strong>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ApplyActionsResultBlock({ result }: { result: ApplyPriceMonitoringReviewActionsResult }) {
  return (
    <div className="state-block">
      <strong>Actions applied</strong>
      <dl className="summary-grid">
        <SummaryItem label="Status" value={result.status} />
        <SummaryItem label="Review CSV" value={result.review_csv_path} />
        <SummaryItem label="Actions path" value={result.review_actions_path} />
        <SummaryItem label="Actions" value={result.summary?.actions_count} />
        <SummaryItem label="Exportable" value={result.summary?.exportable_count} />
        <SummaryItem label="Ignored" value={result.summary?.ignored_count} />
        <SummaryItem label="Not exportable" value={result.summary?.not_exportable_count} />
      </dl>
    </div>
  );
}

function ExportResultBlock({ result }: { result: ExportPriceMonitoringPriceUpdateResult }) {
  return (
    <div className="state-block">
      <strong>Export result</strong>
      <dl className="summary-grid">
        <SummaryItem label="Status" value={result.status} />
        <SummaryItem label="Output path" value={result.output_path} />
        <SummaryItem label="Rows exported" value={result.rows_exported} />
        <SummaryItem label="Columns" value={result.columns?.join(", ")} />
      </dl>
      <p className="muted">This exports CSV only. OpenCart is not updated automatically.</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{formatValue(value)}</dd>
    </div>
  );
}

export function PriceMonitoringPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [areFiltersLoading, setAreFiltersLoading] = useState(true);

  const [source, setSource] = useState<PriceMonitoringSource>("skroutz");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [marketplace, setMarketplace] = useState<MarketplaceFilter>("all");
  const [q, setQ] = useState("");
  const [selectedModelText, setSelectedModelText] = useState("");
  const [excludedModelText, setExcludedModelText] = useState("");
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [automationEligibleOnly, setAutomationEligibleOnly] = useState(true);
  const [atomicOnly, setAtomicOnly] = useState(true);
  const [hasMpn, setHasMpn] = useState(true);

  const [previewResult, setPreviewResult] = useState<PriceMonitoringSelectionResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [createResult, setCreateResult] = useState<PriceMonitoringSelectionResult | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const [currentRunId, setCurrentRunId] = useState("");
  const [currentRun, setCurrentRun] = useState<PriceMonitoringRun | PriceMonitoringSelectionResult | null>(null);
  const [runs, setRuns] = useState<PriceMonitoringRun[]>([]);
  const [runListMessage, setRunListMessage] = useState<string | null>(null);
  const [isRunsLoading, setIsRunsLoading] = useState(false);
  const [loadRunError, setLoadRunError] = useState<string | null>(null);
  const [isLoadRunLoading, setIsLoadRunLoading] = useState(false);

  const [fetchSource, setFetchSource] = useState<SourceOverride>("");
  const [catalogUrl, setCatalogUrl] = useState("");
  const [fetchResult, setFetchResult] = useState<FetchPriceMonitoringResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  const [enrichedCsvPath, setEnrichedCsvPath] = useState("");
  const [review, setReview] = useState<PriceMonitoringReviewResponse | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [rowActions, setRowActions] = useState<Record<string, RowActionState>>({});

  const [applyResult, setApplyResult] =
    useState<ApplyPriceMonitoringReviewActionsResult | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplyLoading, setIsApplyLoading] = useState(false);

  const [reviewCsvPath, setReviewCsvPath] = useState("");
  const [exportOutputPath, setExportOutputPath] = useState("");
  const [exportResult, setExportResult] =
    useState<ExportPriceMonitoringPriceUpdateResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportLoading, setIsExportLoading] = useState(false);

  const loadFilters = useCallback(async (signal?: AbortSignal) => {
    setAreFiltersLoading(true);
    try {
      const [nextCategories, nextBrands] = await Promise.all([
        commerceClient.listCatalogCategories(signal),
        commerceClient.listCatalogBrands(signal),
      ]);
      if (signal?.aborted) {
        return;
      }

      setCategories(nextCategories);
      setBrands(nextBrands);
      setFilterError(null);
    } catch (error) {
      if (!signal?.aborted) {
        setFilterError(getCommerceApiErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) {
        setAreFiltersLoading(false);
      }
    }
  }, []);

  const loadRuns = useCallback(async (signal?: AbortSignal) => {
    setIsRunsLoading(true);
    try {
      const nextRuns = await commerceClient.listPriceMonitoringRuns(signal);
      if (signal?.aborted) {
        return;
      }

      setRuns(nextRuns);
      setRunListMessage(null);
    } catch (error) {
      if (!signal?.aborted) {
        const message =
          error instanceof CommerceApiError && error.status === 404
            ? "Run listing is not available from this backend. Manual run ID workflow is still available."
            : getCommerceApiErrorMessage(error);
        setRuns([]);
        setRunListMessage(message);
      }
    } finally {
      if (!signal?.aborted) {
        setIsRunsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadFilters(controller.signal);
    void loadRuns(controller.signal);
    return () => controller.abort();
  }, [loadFilters, loadRuns]);

  const buildSelectionBody = (dryRun: boolean) =>
    makeSelectionBody({
      source,
      q,
      category,
      manufacturer,
      marketplace,
      selectedModelText,
      excludedModelText,
      includeIgnored,
      automationEligibleOnly,
      atomicOnly,
      hasMpn,
      dryRun,
    });

  const previewSelection = async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const result = await commerceClient.previewPriceMonitoringSelection(buildSelectionBody(true));
      setPreviewResult(result);
    } catch (error) {
      setPreviewError(getCommerceApiErrorMessage(error));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const createRun = async () => {
    setIsCreateLoading(true);
    setCreateError(null);
    setCreateResult(null);
    try {
      const result = await commerceClient.createPriceMonitoringRun(buildSelectionBody(false));
      const runId = result.run_id === null || result.run_id === undefined ? "" : String(result.run_id);
      setCreateResult(result);
      setCurrentRun(result);
      if (runId) {
        setCurrentRunId(runId);
      }
    } catch (error) {
      setCreateError(getCommerceApiErrorMessage(error));
    } finally {
      setIsCreateLoading(false);
    }
  };

  const loadRun = async (runId = currentRunId.trim()) => {
    if (!runId) {
      setLoadRunError("Enter a run ID first.");
      return;
    }

    setIsLoadRunLoading(true);
    setLoadRunError(null);
    try {
      const run = await commerceClient.getPriceMonitoringRun(runId);
      setCurrentRun(run);
      setCurrentRunId(runId);
    } catch (error) {
      const message =
        error instanceof CommerceApiError && error.status === 404
          ? "Run details are not available from this backend. You can still use this run ID for fetch, review, and export."
          : getCommerceApiErrorMessage(error);
      setCurrentRunId(runId);
      setLoadRunError(message);
    } finally {
      setIsLoadRunLoading(false);
    }
  };

  const fetchPrices = async () => {
    const runId = currentRunId.trim();
    if (!runId) {
      setFetchError("Enter or create a run ID first.");
      return;
    }

    setIsFetchLoading(true);
    setFetchError(null);
    setFetchResult(null);
    try {
      const result = await commerceClient.fetchPriceMonitoringRun(runId, {
        source: fetchSource || null,
        catalog_url: catalogUrl.trim() || null,
      });
      setFetchResult(result);
      if (result.enriched_csv_path) {
        setEnrichedCsvPath(result.enriched_csv_path);
      }
    } catch (error) {
      setFetchError(getCommerceApiErrorMessage(error));
    } finally {
      setIsFetchLoading(false);
    }
  };

  const loadReview = async () => {
    const runId = currentRunId.trim();
    if (!runId) {
      setReviewError("Enter or create a run ID first.");
      return;
    }

    setIsReviewLoading(true);
    setReviewError(null);
    setReview(null);
    try {
      const nextReview = await commerceClient.getPriceMonitoringReview(runId, {
        enriched_csv_path: enrichedCsvPath.trim() || null,
      });
      setReview(nextReview);
      if (nextReview.review_csv_path) {
        setReviewCsvPath(nextReview.review_csv_path);
      }
      if (nextReview.enriched_csv_path) {
        setEnrichedCsvPath(nextReview.enriched_csv_path);
      }
      setRowActions(
        nextReview.items.reduce<Record<string, RowActionState>>((nextActions, item) => {
          nextActions[item.model] = getActionState(item, {});
          return nextActions;
        }, {}),
      );
    } catch (error) {
      setReviewError(getCommerceApiErrorMessage(error));
    } finally {
      setIsReviewLoading(false);
    }
  };

  const updateRowAction = (model: string, patch: Partial<RowActionState>) => {
    setRowActions((currentActions) => {
      const currentAction = currentActions[model] ?? {
        selected_action: "",
        undercut_amount: "",
        reason: "",
      };

      return {
        ...currentActions,
        [model]: {
          ...currentAction,
          ...patch,
        },
      };
    });
  };

  const applyRecommendedActions = () => {
    if (!review) {
      return;
    }

    setRowActions(
      review.items.reduce<Record<string, RowActionState>>((nextActions, item) => {
        const recommendedAction = isAction(item.recommended_action) ? item.recommended_action : "";
        const isNotExportable = item.status === "not_exportable";
        nextActions[item.model] =
          recommendedAction && (!isNotExportable || recommendedAction === "ignore")
            ? {
                selected_action: recommendedAction,
                undercut_amount:
                  recommendedAction === "undercut" &&
                  typeof item.undercut_amount === "number" &&
                  Number.isFinite(item.undercut_amount)
                    ? String(item.undercut_amount)
                    : "",
                reason: recommendedAction === "ignore" ? "manual ignore from price review" : "",
              }
            : {
                selected_action: "",
                undercut_amount: "",
                reason: "",
              };
        return nextActions;
      }, {}),
    );
  };

  const clearActions = () => {
    setRowActions({});
  };

  const actionRows = useMemo(() => review?.items ?? [], [review?.items]);
  const actionErrors = useMemo(
    () =>
      actionRows
        .map((row) => {
          const state = getActionState(row, rowActions);
          const error = getActionError(row, state);
          return error ? `${row.model}: ${error}` : null;
        })
        .filter((error): error is string => error !== null),
    [actionRows, rowActions],
  );

  const actionPayload = useMemo<PriceMonitoringReviewAction[]>(
    () =>
      actionRows
        .map((row) => {
          const state = getActionState(row, rowActions);
          if (!state.selected_action) {
            return null;
          }

          const action: PriceMonitoringReviewAction = {
            model: row.model,
            selected_action: state.selected_action,
          };

          if (state.selected_action === "undercut") {
            action.undercut_amount = Number(state.undercut_amount);
          }

          if (state.selected_action === "ignore" && state.reason.trim().length > 0) {
            action.reason = state.reason.trim();
          }

          return action;
        })
        .filter((action): action is PriceMonitoringReviewAction => action !== null),
    [actionRows, rowActions],
  );

  const applyActions = async () => {
    const runId = currentRunId.trim();
    if (!runId) {
      setApplyError("Enter or create a run ID first.");
      return;
    }

    if (actionPayload.length === 0) {
      setApplyError("Choose at least one action before applying.");
      return;
    }

    if (actionErrors.length > 0) {
      setApplyError(actionErrors[0]);
      return;
    }

    setIsApplyLoading(true);
    setApplyError(null);
    setApplyResult(null);
    try {
      const result = await commerceClient.applyPriceMonitoringReviewActions(runId, {
        enriched_csv_path: enrichedCsvPath.trim() || null,
        actions: actionPayload,
      });
      setApplyResult(result);
      if (result.review_csv_path) {
        setReviewCsvPath(result.review_csv_path);
      }
    } catch (error) {
      setApplyError(getCommerceApiErrorMessage(error));
    } finally {
      setIsApplyLoading(false);
    }
  };

  const exportPriceUpdate = async () => {
    const runId = currentRunId.trim();
    if (!runId) {
      setExportError("Enter or create a run ID first.");
      return;
    }

    setIsExportLoading(true);
    setExportError(null);
    setExportResult(null);
    try {
      const result = await commerceClient.exportPriceMonitoringPriceUpdate(runId, {
        review_csv_path: reviewCsvPath.trim() || null,
        output_path: exportOutputPath.trim() || null,
      });
      setExportResult(result);
    } catch (error) {
      setExportError(getCommerceApiErrorMessage(error));
    } finally {
      setIsExportLoading(false);
    }
  };

  return (
    <div className="page-stack price-monitoring-page">
      <section className="page-header">
        <p className="eyebrow">Price Monitoring</p>
        <h2>Competitor price workflow</h2>
        <p>Preview a catalog selection, fetch competitor prices, review actions, and export CSV only.</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Create / Preview Run</p>
            <h3>Selection</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadFilters()}>
            Refresh filters
          </button>
        </div>

        {areFiltersLoading ? <LoadingState label="Loading categories and brands..." /> : null}
        {filterError ? <ErrorState message={filterError} onRetry={() => void loadFilters()} /> : null}

        <div className="filter-grid">
          <label>
            Source
            <select value={source} onChange={(event) => setSource(event.target.value as PriceMonitoringSource)}>
              <option value="skroutz">Skroutz</option>
              <option value="bestprice">BestPrice</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Manufacturer
            <select value={manufacturer} onChange={(event) => setManufacturer(event.target.value)}>
              <option value="">All manufacturers</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Marketplace
            <select value={marketplace} onChange={(event) => setMarketplace(event.target.value as MarketplaceFilter)}>
              <option value="all">All</option>
              <option value="bestprice">BestPrice</option>
              <option value="skroutz">Skroutz</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </label>
          <label>
            Search
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Model, MPN, or name" />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={includeIgnored}
              onChange={(event) => setIncludeIgnored(event.target.checked)}
            />
            Include ignored
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={automationEligibleOnly}
              onChange={(event) => setAutomationEligibleOnly(event.target.checked)}
            />
            Automation eligible only
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={atomicOnly}
              onChange={(event) => setAtomicOnly(event.target.checked)}
            />
            Atomic only
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={hasMpn} onChange={(event) => setHasMpn(event.target.checked)} />
            Has MPN
          </label>
        </div>

        <div className="split-grid">
          <label>
            Selected models
            <textarea
              value={selectedModelText}
              onChange={(event) => setSelectedModelText(event.target.value)}
              rows={5}
              placeholder={"005606\n123456"}
            />
          </label>
          <label>
            Excluded models
            <textarea
              value={excludedModelText}
              onChange={(event) => setExcludedModelText(event.target.value)}
              rows={5}
              placeholder="One model per line or comma-separated"
            />
          </label>
        </div>

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            disabled={isPreviewLoading || isCreateLoading}
            onClick={() => void previewSelection()}
          >
            {isPreviewLoading ? "Previewing..." : "Preview"}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={isCreateLoading || isPreviewLoading}
            onClick={() => void createRun()}
          >
            {isCreateLoading ? "Creating..." : "Create run"}
          </button>
        </div>

        {previewError ? <ErrorState message={previewError} /> : null}
        {previewResult ? <SelectionResultBlock result={previewResult} /> : null}
        {createError ? <ErrorState message={createError} /> : null}
        {createResult ? <SelectionResultBlock result={createResult} /> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Existing Run / Run Status</p>
            <h3>Current run</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadRuns()}>
            Refresh runs
          </button>
        </div>

        <div className="toolbar">
          <label className="inline-field">
            Run ID
            <input value={currentRunId} onChange={(event) => setCurrentRunId(event.target.value)} />
          </label>
          <button
            className="button secondary"
            type="button"
            disabled={isLoadRunLoading}
            onClick={() => void loadRun()}
          >
            {isLoadRunLoading ? "Loading..." : "Load run"}
          </button>
        </div>

        {isRunsLoading ? <LoadingState label="Loading run list..." /> : null}
        {runListMessage ? <p className="state-block">{runListMessage}</p> : null}
        {loadRunError ? <ErrorState message={loadRunError} /> : null}

        {runs.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Selected</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 10).map((run, index) => {
                  const runId = String(run.run_id ?? run.id ?? "");
                  return (
                    <tr key={runId || index}>
                      <td>{formatValue(runId)}</td>
                      <td>{formatValue(run.status)}</td>
                      <td>{formatValue(run.source)}</td>
                      <td>{formatValue(run.selected_count)}</td>
                      <td>{formatValue(run.created_at)}</td>
                      <td>
                        <button className="button secondary" type="button" onClick={() => void loadRun(runId)}>
                          Use
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {currentRun ? <RunSummaryBlock run={currentRun} /> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fetch Competitor Prices</p>
            <h3>Fetch</h3>
          </div>
        </div>

        <div className="filter-grid">
          <label>
            Source override
            <select value={fetchSource} onChange={(event) => setFetchSource(event.target.value as SourceOverride)}>
              <option value="">Default from run</option>
              <option value="skroutz">Skroutz</option>
              <option value="bestprice">BestPrice</option>
            </select>
          </label>
          <label>
            Catalog URL
            <input
              value={catalogUrl}
              onChange={(event) => setCatalogUrl(event.target.value)}
              placeholder="Optional BestPrice hint"
            />
          </label>
        </div>

        <button
          className="button primary inline-button"
          type="button"
          disabled={isFetchLoading}
          onClick={() => void fetchPrices()}
        >
          {isFetchLoading ? "Fetching..." : "Fetch prices"}
        </button>

        {fetchError ? <ErrorState message={fetchError} /> : null}
        {fetchResult ? <FetchResultBlock result={fetchResult} /> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review & Actions</p>
            <h3>Competitor results</h3>
          </div>
          <div className="button-row">
            <button className="button secondary" type="button" onClick={applyRecommendedActions} disabled={!review}>
              Apply recommended actions
            </button>
            <button className="button secondary" type="button" onClick={clearActions} disabled={!review}>
              Clear actions
            </button>
          </div>
        </div>

        <div className="toolbar">
          <label className="inline-field wide">
            Enriched CSV path
            <input
              value={enrichedCsvPath}
              onChange={(event) => setEnrichedCsvPath(event.target.value)}
              placeholder="Leave empty for backend discovery"
            />
          </label>
          <button
            className="button primary"
            type="button"
            disabled={isReviewLoading}
            onClick={() => void loadReview()}
          >
            {isReviewLoading ? "Loading review..." : "Load review"}
          </button>
        </div>

        {reviewError ? <ErrorState message={reviewError} /> : null}
        {review ? (
          <>
            <dl className="summary-grid">
              <SummaryItem label="Run ID" value={review.run_id} />
              {Object.entries(review.summary ?? {}).map(([key, value]) => (
                <SummaryItem key={key} label={key} value={value} />
              ))}
            </dl>

            {review.items.length === 0 ? (
              <EmptyState title="No review rows" message="The backend returned an empty review." />
            ) : (
              <div className="table-wrap review-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Name</th>
                      <th>MPN</th>
                      <th>Current</th>
                      <th>Competitor</th>
                      <th>Store</th>
                      <th>URL</th>
                      <th>Delta</th>
                      <th>Delta %</th>
                      <th>Recommended</th>
                      <th>Action</th>
                      <th>Undercut</th>
                      <th>Target</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.items.map((item) => {
                      const state = getActionState(item, rowActions);
                      const targetPrice = computeTargetPrice(item, state);
                      const actionError = getActionError(item, state);

                      return (
                        <tr key={item.model}>
                          <td className="nowrap-cell">{item.model}</td>
                          <td>{formatValue(item.name)}</td>
                          <td>{formatValue(item.mpn)}</td>
                          <td className="nowrap-cell">{formatMoney(item.current_price)}</td>
                          <td className="nowrap-cell">{formatMoney(item.competitor_price)}</td>
                          <td>{formatValue(item.competitor_store)}</td>
                          <td className="review-url-cell">
                            {item.competitor_url ? (
                              <a href={item.competitor_url} target="_blank" rel="noreferrer">
                                Open
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>{formatNumber(item.price_delta)}</td>
                          <td>{formatNumber(item.price_delta_percent)}</td>
                          <td>{formatValue(item.recommended_action)}</td>
                          <td>
                            <select
                              value={state.selected_action}
                              onChange={(event) =>
                                updateRowAction(item.model, {
                                  selected_action: event.target.value as "" | PriceMonitoringAction,
                                })
                              }
                            >
                              <option value="">No action</option>
                              <option value="match_price">match_price</option>
                              <option value="undercut">undercut</option>
                              <option value="ignore">ignore</option>
                            </select>
                            {actionError ? <small className="field-error">{actionError}</small> : null}
                          </td>
                          <td>
                            <input
                              className="table-input small-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={state.undercut_amount}
                              disabled={state.selected_action !== "undercut"}
                              onChange={(event) =>
                                updateRowAction(item.model, { undercut_amount: event.target.value })
                              }
                            />
                          </td>
                          <td className="nowrap-cell">{formatMoney(targetPrice)}</td>
                          <td>
                            <input
                              className="table-input"
                              value={state.reason}
                              disabled={state.selected_action !== "ignore"}
                              onChange={(event) => updateRowAction(item.model, { reason: event.target.value })}
                              placeholder="Optional"
                            />
                          </td>
                          <td>{formatValue(item.status)}</td>
                          <td>{item.warnings?.join(", ") || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {actionErrors.length > 0 ? (
              <div className="form-error">
                <strong>Action validation</strong>
                <ul>
                  {actionErrors.slice(0, 5).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              className="button primary inline-button"
              type="button"
              disabled={isApplyLoading}
              onClick={() => void applyActions()}
            >
              {isApplyLoading ? "Applying actions..." : "Apply actions"}
            </button>
          </>
        ) : null}

        {applyError ? <ErrorState message={applyError} /> : null}
        {applyResult ? <ApplyActionsResultBlock result={applyResult} /> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Export Price Update CSV</p>
            <h3>OpenCart CSV export</h3>
          </div>
        </div>
        <p className="state-block">
          This only exports an OpenCart price update CSV. It does not update OpenCart automatically.
        </p>
        <div className="filter-grid">
          <label>
            Review CSV path
            <input
              value={reviewCsvPath}
              onChange={(event) => setReviewCsvPath(event.target.value)}
              placeholder="Leave empty for backend default"
            />
          </label>
          <label>
            Output path
            <input
              value={exportOutputPath}
              onChange={(event) => setExportOutputPath(event.target.value)}
              placeholder="Leave empty for backend default"
            />
          </label>
        </div>
        <button
          className="button primary inline-button"
          type="button"
          disabled={isExportLoading}
          onClick={() => void exportPriceUpdate()}
        >
          {isExportLoading ? "Exporting..." : "Export OpenCart price update CSV"}
        </button>
        {exportError ? <ErrorState message={exportError} /> : null}
        {exportResult ? <ExportResultBlock result={exportResult} /> : null}
      </section>
    </div>
  );
}
