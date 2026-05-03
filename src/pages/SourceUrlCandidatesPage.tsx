import { useCallback, useEffect, useMemo, useState } from "react";
import {
  commerceClient,
  getCommerceApiErrorMessage,
} from "../api/commerceClient";
import type {
  SourceUrlCandidate,
  SourceUrlCandidateListParams,
  SourceUrlCandidateReviewDecision,
  SourceUrlCandidateStatus,
} from "../api/commerceTypes";
import { EmptyState, ErrorState, LoadingState } from "../components/layout/StateBlocks";

const DEFAULT_LIMIT = 50;
const REVIEW_STATUSES: Array<SourceUrlCandidateStatus | "all"> = [
  "needs_review",
  "accepted",
  "rejected",
  "not_found",
  "error",
  "all",
];

interface CandidateFilters {
  status: SourceUrlCandidateStatus | "all";
  sourceName: string;
  runId: string;
  model: string;
  catalogProductId: string;
  minConfidence: string;
  maxConfidence: string;
  matchMethod: string;
  createdFrom: string;
  createdTo: string;
}

const initialFilters: CandidateFilters = {
  status: "needs_review",
  sourceName: "",
  runId: "",
  model: "",
  catalogProductId: "",
  minConfidence: "",
  maxConfidence: "",
  matchMethod: "",
  createdFrom: "",
  createdTo: "",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatMoney(value: unknown): string {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatConfidence(value: unknown): string {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numericValue) ? numericValue.toFixed(4) : "-";
}

function statusClass(status: string | null | undefined): string {
  switch (status) {
    case "accepted":
      return "success";
    case "needs_review":
      return "warning";
    case "rejected":
    case "error":
      return "danger";
    case "not_found":
      return "neutral";
    default:
      return "neutral";
  }
}

function normalizeLabel(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "-";
}

function candidateId(candidate: SourceUrlCandidate): string {
  return String(candidate.id);
}

function getJsonSection(source: unknown, keys: string[]): unknown {
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return undefined;
  }

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) {
      return record[key];
    }
  }

  return undefined;
}

function renderJsonValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function JsonDetail({ value }: { value: unknown }) {
  const rendered = renderJsonValue(value);
  if (rendered === "-") {
    return <span className="muted">-</span>;
  }

  if (typeof value === "object" && value !== null) {
    return <pre className="json-block compact-json-block">{rendered}</pre>;
  }

  return <span>{rendered}</span>;
}

function EvidenceSection({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <div className="candidate-evidence-section">
      <dt>{title}</dt>
      <dd>
        <JsonDetail value={value} />
      </dd>
    </div>
  );
}

function passesCreatedDateFilter(candidate: SourceUrlCandidate, filters: CandidateFilters): boolean {
  if (!filters.createdFrom && !filters.createdTo) {
    return true;
  }

  if (!candidate.created_at) {
    return false;
  }

  const createdTime = new Date(candidate.created_at).getTime();
  if (Number.isNaN(createdTime)) {
    return true;
  }

  if (filters.createdFrom) {
    const fromTime = new Date(`${filters.createdFrom}T00:00:00`).getTime();
    if (!Number.isNaN(fromTime) && createdTime < fromTime) {
      return false;
    }
  }

  if (filters.createdTo) {
    const toTime = new Date(`${filters.createdTo}T23:59:59.999`).getTime();
    if (!Number.isNaN(toTime) && createdTime > toTime) {
      return false;
    }
  }

  return true;
}

function buildParams(filters: CandidateFilters, offset: number): SourceUrlCandidateListParams {
  return {
    status: filters.status === "all" ? null : filters.status,
    source_name: filters.sourceName.trim() || null,
    run_id: filters.runId.trim() || null,
    model: filters.model.trim() || null,
    catalog_product_id: filters.catalogProductId.trim() || null,
    min_confidence: filters.minConfidence.trim() || null,
    max_confidence: filters.maxConfidence.trim() || null,
    limit: DEFAULT_LIMIT,
    offset,
  };
}

function DetailDrawer({
  candidate,
  onClose,
}: {
  candidate: SourceUrlCandidate | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!candidate) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [candidate, onClose]);

  if (!candidate) {
    return null;
  }

  const evidence = candidate.evidence_json;
  const searchedQueries = candidate.searched_queries_json;
  const errorValue =
    getJsonSection(evidence, ["error", "error_message", "message", "error_code"]) ??
    getJsonSection(candidate, ["error", "error_message", "error_code"]);

  return (
    <div className="source-url-drawer-backdrop" onMouseDown={onClose}>
      <section
        className="source-url-drawer source-url-candidate-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-url-candidate-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="source-url-drawer-header">
          <div>
            <p className="eyebrow">Review candidate</p>
            <h2 id="source-url-candidate-drawer-title">Source URL candidate {candidate.id}</h2>
          </div>
          <button className="button secondary" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="source-url-drawer-body">
          <dl className="source-url-product-summary candidate-product-summary">
            <div>
              <dt>Catalog product id</dt>
              <dd>{formatValue(candidate.catalog_product_id)}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{formatValue(candidate.model)}</dd>
            </div>
            <div>
              <dt>MPN</dt>
              <dd>{formatValue(candidate.mpn)}</dd>
            </div>
            <div>
              <dt>Manufacturer</dt>
              <dd>{formatValue(candidate.manufacturer)}</dd>
            </div>
            <div>
              <dt>Product</dt>
              <dd>{formatValue(candidate.product_name)}</dd>
            </div>
          </dl>

          <section className="candidate-detail-card">
            <h3>Candidate</h3>
            <dl className="candidate-detail-list">
              <div>
                <dt>Candidate URL</dt>
                <dd className="source-url-cell">
                  {candidate.candidate_url ? (
                    <a href={candidate.candidate_url} target="_blank" rel="noreferrer">
                      {candidate.candidate_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt>Canonical URL</dt>
                <dd className="source-url-cell">{formatValue(candidate.canonical_url)}</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>{formatValue(candidate.candidate_title)}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{formatMoney(candidate.candidate_price)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{formatValue(candidate.source_name ?? candidate.source_domain)}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{formatValue(candidate.notes)}</dd>
              </div>
            </dl>
          </section>

          <section className="candidate-detail-card">
            <h3>Searched queries</h3>
            <JsonDetail value={searchedQueries} />
          </section>

          <section className="candidate-detail-card">
            <h3>Evidence</h3>
            <dl className="candidate-evidence-grid">
              <EvidenceSection
                title="MPN evidence"
                value={getJsonSection(evidence, ["mpn_evidence", "mpn", "mpn_match"])}
              />
              <EvidenceSection
                title="Model evidence"
                value={getJsonSection(evidence, ["model_evidence", "model", "model_match"])}
              />
              <EvidenceSection
                title="Brand evidence"
                value={getJsonSection(evidence, ["brand_evidence", "brand", "manufacturer"])}
              />
              <EvidenceSection
                title="Category evidence"
                value={getJsonSection(evidence, ["category_evidence", "category"])}
              />
              <EvidenceSection
                title="Price evidence"
                value={getJsonSection(evidence, ["price_evidence", "price"])}
              />
              <EvidenceSection
                title="Title similarity"
                value={getJsonSection(evidence, ["title_similarity", "similarity"])}
              />
              <EvidenceSection
                title="Title-only flag"
                value={getJsonSection(evidence, ["title_only", "title_only_match"])}
              />
              <EvidenceSection title="Error" value={errorValue} />
            </dl>
            <details className="candidate-raw-evidence">
              <summary>Raw evidence JSON</summary>
              <JsonDetail value={evidence} />
            </details>
          </section>
        </div>
      </section>
    </div>
  );
}

export function SourceUrlCandidatesPage() {
  const [filters, setFilters] = useState<CandidateFilters>(initialFilters);
  const [offset, setOffset] = useState(0);
  const [response, setResponse] = useState({
    items: [] as SourceUrlCandidate[],
    total: 0,
    limit: DEFAULT_LIMIT,
    offset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<SourceUrlCandidate | null>(null);
  const [replaceDrafts, setReplaceDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const loadCandidates = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const nextResponse = await commerceClient.listSourceUrlCandidates(
          buildParams(filters, offset),
          signal,
        );
        if (signal?.aborted) {
          return;
        }
        setResponse(nextResponse);
        setError(null);
      } catch (loadError) {
        if (!signal?.aborted) {
          setResponse({ items: [], total: 0, limit: DEFAULT_LIMIT, offset });
          setError(getCommerceApiErrorMessage(loadError));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [filters, offset],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadCandidates(controller.signal);
    return () => controller.abort();
  }, [loadCandidates]);

  const visibleCandidates = useMemo(
    () =>
      response.items.filter((candidate) => {
        const matchesMethod =
          filters.matchMethod.trim().length === 0 ||
          (candidate.match_method ?? "")
            .toLowerCase()
            .includes(filters.matchMethod.trim().toLowerCase());
        return matchesMethod && passesCreatedDateFilter(candidate, filters);
      }),
    [filters, response.items],
  );

  const totalPages = Math.max(1, Math.ceil(response.total / DEFAULT_LIMIT));
  const currentPage = Math.floor(offset / DEFAULT_LIMIT) + 1;

  const setFilter = <Key extends keyof CandidateFilters>(key: Key, value: CandidateFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setOffset(0);
  };

  const updateCandidateInState = (updated: SourceUrlCandidate) => {
    setResponse((current) => ({
      ...current,
      items: current.items.map((item) => (candidateId(item) === candidateId(updated) ? updated : item)),
    }));
    setSelectedCandidate((current) =>
      current && candidateId(current) === candidateId(updated) ? updated : current,
    );
  };

  const reviewCandidate = async (
    candidate: SourceUrlCandidate,
    decision: SourceUrlCandidateReviewDecision,
  ) => {
    const id = candidateId(candidate);
    const replacementUrl = replaceDrafts[id]?.trim() ?? "";
    if (decision === "replace_url" && replacementUrl.length === 0) {
      setNotice("Enter a corrected URL before replacing.");
      return;
    }

    setPendingCandidateId(id);
    setNotice(null);
    try {
      const updated = await commerceClient.reviewSourceUrlCandidate(candidate.id, {
        decision,
        reviewed_url: decision === "replace_url" ? replacementUrl : null,
        review_notes: candidate.notes ?? null,
        reviewed_by: "operator",
      });
      updateCandidateInState(updated);
      setNotice(`Candidate ${id} marked ${normalizeLabel(updated.status)}.`);
    } catch (reviewError) {
      setNotice(getCommerceApiErrorMessage(reviewError));
    } finally {
      setPendingCandidateId(null);
    }
  };

  const copyCandidateUrl = async (url: string) => {
    try {
      await navigator.clipboard?.writeText(url);
      setNotice("Candidate URL copied.");
    } catch {
      setNotice("Could not copy candidate URL in this browser.");
    }
  };

  return (
    <div className="page-stack source-url-candidates-page">
      <header className="page-header">
        <p className="eyebrow">Catalog</p>
        <h2>Source URL Candidate Review</h2>
        <p>Review discovered product URLs before explicit promotion into monitored source URLs.</p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Candidate queue</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadCandidates()}>
            Refresh
          </button>
        </div>

        <div className="filter-grid source-url-candidate-filters">
          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) => setFilter("status", event.target.value as CandidateFilters["status"])}
            >
              {REVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {normalizeLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source name
            <input
              type="search"
              value={filters.sourceName}
              onChange={(event) => setFilter("sourceName", event.target.value)}
              placeholder="skroutz, bestprice"
            />
          </label>
          <label>
            Run id
            <input
              type="search"
              value={filters.runId}
              onChange={(event) => setFilter("runId", event.target.value)}
            />
          </label>
          <label>
            Model
            <input
              type="search"
              value={filters.model}
              onChange={(event) => setFilter("model", event.target.value)}
            />
          </label>
          <label>
            Catalog product id
            <input
              type="search"
              value={filters.catalogProductId}
              onChange={(event) => setFilter("catalogProductId", event.target.value)}
            />
          </label>
          <label>
            Min confidence
            <input
              type="number"
              min={0}
              max={1}
              step={0.0001}
              value={filters.minConfidence}
              onChange={(event) => setFilter("minConfidence", event.target.value)}
            />
          </label>
          <label>
            Max confidence
            <input
              type="number"
              min={0}
              max={1}
              step={0.0001}
              value={filters.maxConfidence}
              onChange={(event) => setFilter("maxConfidence", event.target.value)}
            />
          </label>
          <label>
            Match method
            <input
              type="search"
              value={filters.matchMethod}
              onChange={(event) => setFilter("matchMethod", event.target.value)}
              placeholder="mpn, model, title"
            />
          </label>
          <label>
            Created from
            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) => setFilter("createdFrom", event.target.value)}
            />
          </label>
          <label>
            Created to
            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) => setFilter("createdTo", event.target.value)}
            />
          </label>
        </div>

        <div className="toolbar">
          <p className="muted">
            Showing {visibleCandidates.length.toLocaleString()} of {response.total.toLocaleString()} candidates.
            Match method and created date are narrowed in the UI for the loaded page.
          </p>
          <button className="button secondary" type="button" onClick={() => setFilters(initialFilters)}>
            Reset filters
          </button>
        </div>

        {notice ? <p className="form-warning">{notice}</p> : null}
        {isLoading ? <LoadingState label="Loading source URL candidates..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void loadCandidates()} /> : null}
        {!isLoading && !error && visibleCandidates.length === 0 ? (
          <EmptyState
            title="No source URL candidates"
            message="There are no candidates for the active filters."
          />
        ) : null}

        {!isLoading && !error && visibleCandidates.length > 0 ? (
          <>
            <div className="table-wrap source-url-candidates-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Candidate id</th>
                    <th>Run id</th>
                    <th>Catalog product id</th>
                    <th>Model</th>
                    <th>Product name</th>
                    <th>Manufacturer</th>
                    <th>Source name</th>
                    <th>Candidate title</th>
                    <th>Candidate price</th>
                    <th>Own price</th>
                    <th>Confidence</th>
                    <th>Match method</th>
                    <th>Match status</th>
                    <th>Review status</th>
                    <th>Created at</th>
                    <th>Candidate URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCandidates.map((candidate) => {
                    const id = candidateId(candidate);
                    const isPending = pendingCandidateId === id;
                    return (
                      <tr key={id}>
                        <td>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            {candidate.id}
                          </button>
                        </td>
                        <td className="nowrap-cell">{formatValue(candidate.run_id)}</td>
                        <td>{formatValue(candidate.catalog_product_id)}</td>
                        <td className="nowrap-cell">{formatValue(candidate.model)}</td>
                        <td>{formatValue(candidate.product_name)}</td>
                        <td>{formatValue(candidate.manufacturer)}</td>
                        <td>{formatValue(candidate.source_name)}</td>
                        <td>{formatValue(candidate.candidate_title)}</td>
                        <td className="nowrap-cell">{formatMoney(candidate.candidate_price)}</td>
                        <td className="nowrap-cell">{formatMoney(candidate.own_price)}</td>
                        <td>{formatConfidence(candidate.confidence_score)}</td>
                        <td>{formatValue(candidate.match_method)}</td>
                        <td>{formatValue(candidate.match_status)}</td>
                        <td>
                          <span className={`status-badge ${statusClass(candidate.status)}`}>
                            {normalizeLabel(candidate.status ?? null)}
                          </span>
                        </td>
                        <td className="nowrap-cell">{formatDate(candidate.created_at)}</td>
                        <td className="review-url-cell">
                          <div className="candidate-url-actions">
                            {candidate.candidate_url ? (
                              <>
                                <a
                                  className="button secondary compact-button"
                                  href={candidate.candidate_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open candidate URL ${id}`}
                                  title="Open candidate URL"
                                >
                                  ↗
                                </a>
                                <button
                                  className="button secondary compact-button"
                                  type="button"
                                  onClick={() => void copyCandidateUrl(candidate.candidate_url ?? "")}
                                  aria-label={`Copy candidate URL ${id}`}
                                  title="Copy candidate URL"
                                >
                                  ⧉
                                </button>
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="source-url-candidate-actions">
                            <div className="button-row">
                              <button
                                className="button primary compact-button"
                                type="button"
                                disabled={isPending}
                                onClick={() => void reviewCandidate(candidate, "accept")}
                              >
                                Accept
                              </button>
                              <button
                                className="button danger compact-button"
                                type="button"
                                disabled={isPending}
                                onClick={() => void reviewCandidate(candidate, "reject")}
                              >
                                Reject
                              </button>
                              <button
                                className="button secondary compact-button"
                                type="button"
                                disabled={isPending}
                                onClick={() => void reviewCandidate(candidate, "not_found")}
                              >
                                Not found
                              </button>
                              <button
                                className="button secondary compact-button"
                                type="button"
                                disabled={isPending}
                                onClick={() => void reviewCandidate(candidate, "needs_manual_review")}
                              >
                                Needs review
                              </button>
                              <button
                                className="button secondary compact-button"
                                type="button"
                                onClick={() => setSelectedCandidate(candidate)}
                              >
                                Details
                              </button>
                            </div>
                            <div className="source-url-replace-row">
                              <input
                                className="table-input"
                                type="url"
                                value={replaceDrafts[id] ?? ""}
                                onChange={(event) =>
                                  setReplaceDrafts((current) => ({ ...current, [id]: event.target.value }))
                                }
                                placeholder="Corrected URL"
                                aria-label={`Corrected URL for candidate ${id}`}
                              />
                              <button
                                className="button secondary compact-button"
                                type="button"
                                disabled={isPending}
                                onClick={() => void reviewCandidate(candidate, "replace_url")}
                              >
                                Replace URL
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination-row">
              <button
                className="button secondary"
                type="button"
                disabled={offset <= 0 || isLoading}
                onClick={() => setOffset((current) => Math.max(0, current - DEFAULT_LIMIT))}
              >
                Previous
              </button>
              <span className="muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="button secondary"
                type="button"
                disabled={offset + DEFAULT_LIMIT >= response.total || isLoading}
                onClick={() => setOffset((current) => current + DEFAULT_LIMIT)}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>

      <DetailDrawer candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
    </div>
  );
}
