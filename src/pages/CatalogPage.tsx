import { useCallback, useEffect, useMemo, useState } from "react";
import { commerceClient, getCommerceApiErrorMessage } from "../api/commerceClient";
import type {
  CatalogProduct,
  CatalogProductsParams,
  CatalogProductsResponse,
  CatalogSummary,
  MarketplaceFilter,
  PriceMonitoringSelectionBody,
  PriceMonitoringSelectionResult,
  PriceMonitoringSource,
} from "../api/commerceTypes";
import { EmptyState, ErrorState, LoadingState } from "../components/layout/StateBlocks";

const DEFAULT_PAGE_SIZE = 100;

function normalizeModel(model: string): string {
  return model.trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
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

function getSummaryNumber(summary: CatalogSummary | null, keys: string[]): number | null {
  if (!summary) {
    return null;
  }

  for (const key of keys) {
    const value = summary[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getSelectionBlocker(product: CatalogProduct): string | null {
  if (product.is_atomic_model === false) {
    return "Composite model";
  }

  if (product.automation_eligible === false) {
    return "Not eligible";
  }

  if (product.ignored === true) {
    return "Ignored";
  }

  return null;
}

function getMarketplaceStatus(value: number | null | undefined): string {
  if (value === 1) {
    return "active";
  }

  if (value === 0) {
    return "inactive";
  }

  return formatValue(value);
}

function makeSelectionBody(
  source: PriceMonitoringSource,
  selectedModels: Set<string>,
  filters: {
    q: string;
    category: string;
    manufacturer: string;
    marketplace: MarketplaceFilter;
    includeIgnored: boolean;
  },
  dryRun: boolean,
): PriceMonitoringSelectionBody {
  const q = filters.q.trim();

  return {
    source,
    filters: {
      q: q.length > 0 ? q : null,
      category: filters.category || null,
      manufacturer: filters.manufacturer || null,
      marketplace: filters.marketplace === "all" ? null : filters.marketplace,
      has_mpn: true,
      atomic_only: true,
      automation_eligible_only: true,
    },
    selected_models: Array.from(selectedModels),
    excluded_models: [],
    include_ignored: filters.includeIgnored,
    dry_run: dryRun,
  };
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value === null ? "-" : value.toLocaleString()}</dd>
    </div>
  );
}

function ResultSummary({ result }: { result: PriceMonitoringSelectionResult }) {
  const selectedItems = result.selected_items ?? result.selected ?? [];

  return (
    <div className="result-block">
      <dl className="summary-grid">
        {"run_id" in result ? <SummaryText label="Run ID" value={result.run_id} /> : null}
        {"status" in result ? <SummaryText label="Status" value={result.status} /> : null}
        {"source" in result ? <SummaryText label="Source" value={result.source} /> : null}
        {"selected_count" in result ? (
          <SummaryText label="Selected" value={result.selected_count} />
        ) : null}
        {"skipped_count" in result ? <SummaryText label="Skipped" value={result.skipped_count} /> : null}
        {"output_dir" in result ? <SummaryText label="Output dir" value={result.output_dir} /> : null}
        {"input_csv_path" in result ? (
          <SummaryText label="Input CSV" value={result.input_csv_path} />
        ) : null}
        {"selection_summary_path" in result ? (
          <SummaryText label="Selection summary" value={result.selection_summary_path} />
        ) : null}
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
        <div className="compact-list">
          <strong>Selected items</strong>
          <ul>
            {selectedItems.slice(0, 25).map((item, index) => (
              <li key={`${item.model ?? "item"}-${index}`}>
                {formatValue(item.model)} {item.name ? `- ${item.name}` : ""}
              </li>
            ))}
          </ul>
          {selectedItems.length > 25 ? (
            <p className="muted">Showing 25 of {selectedItems.length} returned items.</p>
          ) : null}
        </div>
      ) : null}

      {result.skipped_reasons ? (
        <div className="compact-list">
          <strong>Skipped reasons</strong>
          <pre className="json-block">{JSON.stringify(result.skipped_reasons, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function SummaryText({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{formatValue(value)}</dd>
    </div>
  );
}

function CatalogSetupHint() {
  return (
    <div className="setup-hint compact">
      <strong>Catalog setup check</strong>
      <ul>
        <li>Commerce API must be running: <code>pricefetcher-api</code></li>
        <li>Expected catalog file: <code>C:\Users\user\Downloads\sourceCata.csv</code></li>
        <li>UI endpoint: <code>/commerce-api/catalog/summary</code></li>
        <li>Backend endpoint: <code>http://127.0.0.1:8001/api/catalog/summary</code></li>
      </ul>
    </div>
  );
}

export function CatalogPage() {
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [areFiltersLoading, setAreFiltersLoading] = useState(true);

  const [productsResponse, setProductsResponse] = useState<CatalogProductsResponse>({
    items: [],
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total: 0,
    filtered_total: 0,
  });
  const [productsError, setProductsError] = useState<string | null>(null);
  const [areProductsLoading, setAreProductsLoading] = useState(true);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [marketplace, setMarketplace] = useState<MarketplaceFilter>("all");
  const [source, setSource] = useState<PriceMonitoringSource>("skroutz");
  const [showComposite, setShowComposite] = useState(false);
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => new Set());

  const [previewResult, setPreviewResult] = useState<PriceMonitoringSelectionResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [runResult, setRunResult] = useState<PriceMonitoringSelectionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunLoading, setIsRunLoading] = useState(false);

  const loadSummary = useCallback(async (signal?: AbortSignal) => {
    setIsSummaryLoading(true);
    try {
      const nextSummary = await commerceClient.getCatalogSummary(signal);
      if (signal?.aborted) {
        return;
      }

      setSummary(nextSummary);
      setSummaryError(null);
    } catch (error) {
      if (!signal?.aborted) {
        setSummaryError(getCommerceApiErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) {
        setIsSummaryLoading(false);
      }
    }
  }, []);

  const loadFilterOptions = useCallback(async (signal?: AbortSignal) => {
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
      setFiltersError(null);
    } catch (error) {
      if (!signal?.aborted) {
        setFiltersError(getCommerceApiErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) {
        setAreFiltersLoading(false);
      }
    }
  }, []);

  const productParams = useMemo<CatalogProductsParams>(
    () => ({
      q: q.trim() || null,
      category: category || null,
      manufacturer: manufacturer || null,
      marketplace,
      page,
      page_size: pageSize,
      atomic_only: !showComposite,
      ignored: includeIgnored ? "include" : "exclude",
    }),
    [category, includeIgnored, manufacturer, marketplace, page, pageSize, q, showComposite],
  );

  const loadProducts = useCallback(
    async (signal?: AbortSignal) => {
      setAreProductsLoading(true);
      try {
        const nextProducts = await commerceClient.listCatalogProducts(productParams, signal);
        if (signal?.aborted) {
          return;
        }

        setProductsResponse(nextProducts);
        setProductsError(null);
      } catch (error) {
        if (!signal?.aborted) {
          setProductsError(getCommerceApiErrorMessage(error));
        }
      } finally {
        if (!signal?.aborted) {
          setAreProductsLoading(false);
        }
      }
    },
    [productParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadSummary(controller.signal);
    void loadFilterOptions(controller.signal);
    return () => controller.abort();
  }, [loadFilterOptions, loadSummary]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  useEffect(() => {
    setPage(1);
    setSelectedModels(new Set());
    setPreviewResult(null);
    setRunResult(null);
  }, [category, includeIgnored, manufacturer, marketplace, pageSize, q, showComposite]);

  const eligibleVisibleModels = useMemo(
    () =>
      productsResponse.items
        .filter((product) => getSelectionBlocker(product) === null)
        .map((product) => normalizeModel(product.model))
        .filter((model) => model.length > 0),
    [productsResponse.items],
  );

  const selectedVisibleCount = eligibleVisibleModels.filter((model) =>
    selectedModels.has(model),
  ).length;
  const allVisibleSelected =
    eligibleVisibleModels.length > 0 && selectedVisibleCount === eligibleVisibleModels.length;

  const toggleModel = (model: string) => {
    const normalizedModel = normalizeModel(model);
    if (normalizedModel.length === 0) {
      return;
    }

    setSelectedModels((current) => {
      const next = new Set(current);
      if (next.has(normalizedModel)) {
        next.delete(normalizedModel);
      } else {
        next.add(normalizedModel);
      }

      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedModels((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        eligibleVisibleModels.forEach((model) => next.delete(model));
      } else {
        eligibleVisibleModels.forEach((model) => next.add(model));
      }

      return next;
    });
  };

  const buildSelectionBody = (dryRun: boolean) =>
    makeSelectionBody(
      source,
      selectedModels,
      { q, category, manufacturer, marketplace, includeIgnored },
      dryRun,
    );

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
    setIsRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const result = await commerceClient.createPriceMonitoringRun(buildSelectionBody(false));
      setRunResult(result);
    } catch (error) {
      setRunError(getCommerceApiErrorMessage(error));
    } finally {
      setIsRunLoading(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(productsResponse.filtered_total / productsResponse.page_size),
  );

  return (
    <div className="page-stack catalog-page">
      <section className="page-header">
        <p className="eyebrow">Catalog</p>
        <h2>Commerce catalog</h2>
        <p>Commerce API base URL: {commerceClient.commerceApiBaseUrl}</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Summary</p>
            <h3>Catalog health</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadSummary()}>
            Refresh
          </button>
        </div>
        {isSummaryLoading ? <LoadingState label="Loading catalog summary..." /> : null}
        {summaryError ? (
          <>
            <ErrorState message={summaryError} onRetry={() => void loadSummary()} />
            <CatalogSetupHint />
          </>
        ) : null}
        {!isSummaryLoading && !summaryError ? (
          <dl className="summary-grid catalog-summary-grid">
            <SummaryCard label="Total products" value={getSummaryNumber(summary, ["total_products", "total"])} />
            <SummaryCard label="Active products" value={getSummaryNumber(summary, ["active_products", "active"])} />
            <SummaryCard label="Atomic products" value={getSummaryNumber(summary, ["atomic_products", "atomic"])} />
            <SummaryCard
              label="Composite/invalid"
              value={getSummaryNumber(summary, [
                "composite_invalid_models",
                "composite_products",
                "non_atomic_products",
              ])}
            />
            <SummaryCard
              label="BestPrice products"
              value={getSummaryNumber(summary, ["bestprice_products", "bestprice"])}
            />
            <SummaryCard
              label="Skroutz products"
              value={getSummaryNumber(summary, ["skroutz_products", "skroutz"])}
            />
            <SummaryCard
              label="Missing MPN"
              value={getSummaryNumber(summary, ["missing_mpn", "missing_mpn_products"])}
            />
          </dl>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Catalog products</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadProducts()}>
            Refresh
          </button>
        </div>

        {areFiltersLoading ? <p className="muted">Loading categories and brands...</p> : null}
        {filtersError ? (
          <ErrorState message={filtersError} onRetry={() => void loadFilterOptions()} />
        ) : null}

        <div className="filter-grid">
          <label>
            Search
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Model, MPN, or name"
            />
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
            <select
              value={marketplace}
              onChange={(event) => setMarketplace(event.target.value as MarketplaceFilter)}
            >
              <option value="all">All</option>
              <option value="bestprice">BestPrice</option>
              <option value="skroutz">Skroutz</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </label>

          <label>
            Price monitoring source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as PriceMonitoringSource)}
            >
              <option value="skroutz">Skroutz</option>
              <option value="bestprice">BestPrice</option>
            </select>
          </label>

          <label>
            Page size
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showComposite}
              onChange={(event) => setShowComposite(event.target.checked)}
            />
            Show composite models
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={includeIgnored}
              onChange={(event) => setIncludeIgnored(event.target.checked)}
            />
            Include ignored
          </label>
        </div>

        <div className="toolbar">
          <p className="muted">
            {productsResponse.filtered_total.toLocaleString()} matching products.
            {selectedModels.size > 0 ? ` ${selectedModels.size} selected.` : " No products selected."}
            {" "}Selection clears when filters change.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              type="button"
              onClick={() => void previewSelection()}
              disabled={isPreviewLoading || isRunLoading}
            >
              {isPreviewLoading ? "Previewing..." : "Preview selection"}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => void createRun()}
              disabled={isRunLoading || isPreviewLoading}
            >
              {isRunLoading ? "Creating..." : "Create price monitoring run"}
            </button>
          </div>
        </div>

        {previewError ? <ErrorState message={previewError} /> : null}
        {previewResult ? (
          <div className="state-block">
            <strong>Selection preview</strong>
            <ResultSummary result={previewResult} />
          </div>
        ) : null}

        {runError ? <ErrorState message={runError} /> : null}
        {runResult ? (
          <div className="state-block">
            <strong>Price monitoring run</strong>
            <ResultSummary result={runResult} />
          </div>
        ) : null}

        {areProductsLoading ? <LoadingState label="Loading catalog products..." /> : null}
        {productsError ? (
          <>
            <ErrorState message={productsError} onRetry={() => void loadProducts()} />
            <CatalogSetupHint />
          </>
        ) : null}
        {!areProductsLoading && !productsError && productsResponse.items.length === 0 ? (
          <EmptyState title="No products found" message="Try broadening the current filters." />
        ) : null}
        {!areProductsLoading && !productsError && productsResponse.items.length > 0 ? (
          <>
            <div className="table-wrap catalog-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Select all visible eligible products"
                        checked={allVisibleSelected}
                        disabled={eligibleVisibleModels.length === 0}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th>Model</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Manufacturer</th>
                    <th>MPN</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>BestPrice</th>
                    <th>Skroutz</th>
                    <th>Ignored</th>
                    <th>Warnings / eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {productsResponse.items.map((product) => {
                    const model = normalizeModel(product.model);
                    const selectionBlocker = getSelectionBlocker(product);
                    const isSelected = selectedModels.has(model);
                    const warnings = Array.isArray(product.warnings) ? product.warnings : [];

                    return (
                      <tr key={model}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${model}`}
                            checked={isSelected}
                            disabled={selectionBlocker !== null}
                            onChange={() => toggleModel(model)}
                          />
                        </td>
                        <td className="nowrap-cell">{model}</td>
                        <td>{formatValue(product.name)}</td>
                        <td>{formatValue(product.category)}</td>
                        <td>{formatValue(product.manufacturer)}</td>
                        <td>{formatValue(product.mpn)}</td>
                        <td className="nowrap-cell">{formatMoney(product.price)}</td>
                        <td>{formatValue(product.quantity)}</td>
                        <td>
                          <span className="status-badge neutral">
                            {getMarketplaceStatus(product.bestprice_status)}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge neutral">
                            {getMarketplaceStatus(product.skroutz_status)}
                          </span>
                        </td>
                        <td>{product.ignored ? "yes" : "no"}</td>
                        <td>
                          <div className="eligibility-cell">
                            {selectionBlocker ? (
                              <span className="status-badge queued">{selectionBlocker}</span>
                            ) : (
                              <span className="status-badge success">Eligible</span>
                            )}
                            {warnings.length > 0 ? (
                              <span className="muted">{warnings.join(", ")}</span>
                            ) : null}
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
                disabled={page <= 1 || areProductsLoading}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                Previous
              </button>
              <span className="muted">
                Page {productsResponse.page} of {totalPages}
              </span>
              <button
                className="button secondary"
                type="button"
                disabled={page >= totalPages || areProductsLoading}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
