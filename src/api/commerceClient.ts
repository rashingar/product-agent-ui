import type {
  ApplyPriceMonitoringReviewActionsBody,
  ApplyPriceMonitoringReviewActionsResult,
  ArtifactItem,
  ArtifactListResponse,
  ArtifactPayload,
  ArtifactReadResponse,
  ArtifactRoot,
  BridgeRunBody,
  BridgeRunResponse,
  CatalogBrandOption,
  CatalogCategoryHierarchyResponse,
  CatalogCategoryNode,
  CatalogCategoryOption,
  CatalogFamilyNode,
  CatalogProduct,
  CatalogProductsParams,
  CatalogProductsResponse,
  CatalogSnapshot,
  CatalogSnapshotResponse,
  CatalogSubCategoryNode,
  CatalogSummary,
  ExportPriceMonitoringPriceUpdateBody,
  ExportPriceMonitoringPriceUpdateResult,
  FetchPriceMonitoringBody,
  FetchPriceMonitoringResult,
  FileListParams,
  FileListResponse,
  FileListItem,
  FileRoot,
  PathRootsEnv,
  PathRootsResponse,
  PriceHistoryResponse,
  PriceMonitoringDbStatus,
  PriceObservation,
  PriceObservationsParams,
  PriceObservationsResponse,
  PriceMonitoringReviewItem,
  PriceMonitoringReviewParams,
  PriceMonitoringReviewResponse,
  PriceMonitoringRun,
  PriceMonitoringSelectionBody,
  PriceMonitoringSelectionResult,
  RunPriceObservationsResponse,
  ReadCsvFileBody,
  ReadCsvFileResponse,
  SaveCsvCopyBody,
  SaveCsvFileBody,
  SaveCsvResponse,
} from "./commerceTypes";

const DEFAULT_COMMERCE_API_BASE_URL = "/commerce-api";

const configuredCommerceApiBaseUrl = import.meta.env.VITE_COMMERCE_API_BASE_URL?.replace(
  /\/+$/,
  "",
);
const commerceApiBaseUrl =
  configuredCommerceApiBaseUrl && configuredCommerceApiBaseUrl.length > 0
    ? configuredCommerceApiBaseUrl
    : DEFAULT_COMMERCE_API_BASE_URL;

export class CommerceApiError extends Error {
  readonly status: number;
  readonly details: unknown;
  readonly path?: string;

  constructor(message: string, status: number, details: unknown, path?: string) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
    this.details = details;
    this.path = path;
  }
}

type CommerceRequestOptions = Omit<RequestInit, "body"> & {
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

    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (isRecord(item)) {
            const message = item.msg ?? item.message ?? item.detail;
            if (typeof message === "string") {
              return message;
            }

            return JSON.stringify(item);
          }

          return String(item);
        })
        .join("; ");
    }
  }

  return null;
}

export function getCommerceApiErrorMessage(error: unknown): string {
  if (error instanceof CommerceApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while talking to the commerce backend.";
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

function buildHeaders(options: CommerceRequestOptions): HeadersInit {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function appendQuery(path: string, params?: QueryParams): string {
  if (!params) {
    return path;
  }

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function toCommerceArtifactUrl(urlOrPath: string): string {
  const value = urlOrPath.trim();
  if (value.length === 0) {
    return "";
  }

  if (value.startsWith("/commerce-api/")) {
    return value;
  }

  if (value.startsWith("/api/artifacts/")) {
    return value.replace(/^\/api\/artifacts\//, "/commerce-api/artifacts/");
  }

  return `/commerce-api/artifacts/download?path=${encodeURIComponent(value)}`;
}

export function getArtifactPath(value: ArtifactPayload | string | null | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return value?.path ?? "";
}

function normalizeStringList(payload: unknown): string[] {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? payload.items ?? payload.categories ?? payload.brands ?? payload.data ?? payload.results
      : null;

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map((value) => String(value));
}

function getArrayPayload(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeProduct(value: unknown): CatalogProduct | null {
  if (!isRecord(value) || typeof value.model !== "string") {
    return null;
  }

  return value as CatalogProduct;
}

function normalizeProductsResponse(payload: unknown): CatalogProductsResponse {
  if (!isRecord(payload)) {
    return {
      items: [],
      page: 1,
      page_size: 100,
      total: 0,
      filtered_total: 0,
    };
  }

  const items = Array.isArray(payload.items)
    ? payload.items.map(normalizeProduct).filter((item): item is CatalogProduct => item !== null)
    : [];

  return {
    items,
    page: toNumber(payload.page, 1),
    page_size: toNumber(payload.page_size, items.length || 100),
    total: toNumber(payload.total, items.length),
    filtered_total: toNumber(payload.filtered_total, items.length),
  };
}

function normalizeFileRoot(value: unknown): FileRoot | null {
  if (!isRecord(value) || typeof value.path !== "string") {
    return null;
  }

  return {
    path: value.path,
    exists: value.exists === true,
  };
}

function normalizeFileRoots(payload: unknown): FileRoot[] {
  return getArrayPayload(payload, ["roots", "items", "data", "results"])
    .map(normalizeFileRoot)
    .filter((root): root is FileRoot => root !== null);
}

function normalizeArtifactRoot(value: unknown): ArtifactRoot | null {
  if (!isRecord(value)) {
    return null;
  }

  const path = value.path ?? value.root;
  if (typeof path !== "string" && typeof path !== "number") {
    return null;
  }

  return {
    path: String(path),
    exists: typeof value.exists === "boolean" ? value.exists : null,
    name: typeof value.name === "string" ? value.name : null,
    source: typeof value.source === "string" ? value.source : null,
    is_default: typeof value.is_default === "boolean" ? value.is_default : null,
    is_configured: typeof value.is_configured === "boolean" ? value.is_configured : null,
  };
}

function normalizeArtifactRoots(payload: unknown): ArtifactRoot[] {
  return getArrayPayload(payload, ["roots", "items", "data", "results"])
    .map(normalizeArtifactRoot)
    .filter((root): root is ArtifactRoot => root !== null);
}

function normalizePathRootsEnv(value: unknown): PathRootsEnv {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<PathRootsEnv>((env, [key, envValue]) => {
    env[key] =
      typeof envValue === "string" || envValue === null || envValue === undefined
        ? envValue
        : String(envValue);
    return env;
  }, {});
}

function normalizePathRoots(payload: unknown): PathRootsResponse {
  if (!isRecord(payload)) {
    return {
      artifact_roots: [],
      file_roots: [],
      output_roots: [],
      env: {},
      path_separator: null,
      platform: null,
    };
  }

  return {
    artifact_roots: getArrayPayload(payload.artifact_roots, ["roots", "items", "data", "results"])
      .map(normalizeArtifactRoot)
      .filter((root): root is ArtifactRoot => root !== null),
    file_roots: getArrayPayload(payload.file_roots, ["roots", "items", "data", "results"])
      .map(normalizeArtifactRoot)
      .filter((root): root is ArtifactRoot => root !== null),
    output_roots: getArrayPayload(payload.output_roots, ["roots", "items", "data", "results"])
      .map(normalizeArtifactRoot)
      .filter((root): root is ArtifactRoot => root !== null),
    env: normalizePathRootsEnv(payload.env),
    path_separator: typeof payload.path_separator === "string" ? payload.path_separator : null,
    platform: typeof payload.platform === "string" ? payload.platform : null,
  };
}

function getNameFromPath(path: string): string {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : path;
}

export function normalizeCommerceArtifact(value: unknown): ArtifactItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const path = value.path;
  if (typeof path !== "string" && typeof path !== "number") {
    return null;
  }

  const normalizedPath = String(path);
  const name = value.name;

  return {
    ...value,
    name: typeof name === "string" && name.trim().length > 0 ? name : getNameFromPath(normalizedPath),
    path: normalizedPath,
    extension: typeof value.extension === "string" ? value.extension : null,
    size_bytes: typeof value.size_bytes === "number" ? value.size_bytes : null,
    modified_at: typeof value.modified_at === "string" ? value.modified_at : null,
    download_url:
      typeof value.download_url === "string" && value.download_url.trim().length > 0
        ? toCommerceArtifactUrl(value.download_url)
        : null,
    read_url:
      typeof value.read_url === "string" && value.read_url.trim().length > 0
        ? toCommerceArtifactUrl(value.read_url)
        : null,
    is_allowed: value.is_allowed === false ? false : true,
    can_read: value.can_read === false ? false : true,
    can_download: value.can_download === false ? false : true,
    warning: typeof value.warning === "string" && value.warning.trim().length > 0 ? value.warning : null,
  };
}

function normalizeArtifactPathValue(value: unknown): ArtifactPayload | string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return normalizeCommerceArtifact(value);
}

function normalizeArtifactList(payload: unknown): ArtifactListResponse {
  const source = isRecord(payload) ? payload : {};
  return {
    root: typeof source.root === "string" ? source.root : null,
    run_id:
      typeof source.run_id === "string" || typeof source.run_id === "number"
        ? source.run_id
        : null,
    items: getArrayPayload(payload, ["items", "artifacts", "data", "results"])
      .map(normalizeCommerceArtifact)
      .filter((item): item is ArtifactItem => item !== null),
  };
}

function normalizeArtifactRead(payload: unknown): ArtifactReadResponse {
  if (typeof payload === "string") {
    return {
      path: "",
      content: payload,
    };
  }

  if (!isRecord(payload)) {
    return {
      path: "",
      content: "",
    };
  }

  return {
    ...payload,
    path: typeof payload.path === "string" ? payload.path : "",
    content:
      typeof payload.content === "string"
        ? payload.content
        : typeof payload.text === "string"
          ? payload.text
          : "",
    truncated: typeof payload.truncated === "boolean" ? payload.truncated : null,
    size_bytes: typeof payload.size_bytes === "number" ? payload.size_bytes : null,
    encoding: typeof payload.encoding === "string" ? payload.encoding : null,
  };
}

function normalizeFileList(payload: unknown): FileListResponse {
  if (!isRecord(payload)) {
    return {
      root: "",
      relative_path: "",
      items: [],
    };
  }

  const items = getArrayPayload(payload.items, [])
    .filter(isRecord)
    .map<FileListItem>((item) => ({
      name: typeof item.name === "string" ? item.name : "",
      path: typeof item.path === "string" ? item.path : "",
      type: item.type === "directory" ? "directory" : "file",
      extension: typeof item.extension === "string" ? item.extension : "",
      size_bytes: typeof item.size_bytes === "number" ? item.size_bytes : null,
      modified_at: typeof item.modified_at === "string" ? item.modified_at : null,
    }))
    .filter((item) => item.name.length > 0 && item.path.length > 0);

  return {
    root: typeof payload.root === "string" ? payload.root : "",
    relative_path: typeof payload.relative_path === "string" ? payload.relative_path : "",
    items,
  };
}

function normalizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function normalizeCsvRead(payload: unknown): ReadCsvFileResponse {
  if (!isRecord(payload)) {
    return {
      path: "",
      filename: "",
      delimiter: ",",
      encoding: null,
      columns: [],
      rows: [],
      returned_rows: 0,
      total_rows: 0,
      size_bytes: null,
      modified_at: null,
    };
  }

  const columns = Array.isArray(payload.columns)
    ? payload.columns
        .filter((column): column is string | number => typeof column === "string" || typeof column === "number")
        .map((column) => String(column))
    : [];
  const rows = Array.isArray(payload.rows)
    ? payload.rows.filter(isRecord).map((row) =>
        columns.reduce<Record<string, string>>((nextRow, column) => {
          nextRow[column] = normalizeCsvValue(row[column]);
          return nextRow;
        }, {}),
      )
    : [];

  return {
    path: typeof payload.path === "string" ? payload.path : "",
    filename: typeof payload.filename === "string" ? payload.filename : "",
    delimiter: typeof payload.delimiter === "string" ? payload.delimiter : ",",
    encoding: typeof payload.encoding === "string" ? payload.encoding : null,
    columns,
    rows,
    returned_rows: toNumber(payload.returned_rows, rows.length),
    total_rows: toNumber(payload.total_rows, rows.length),
    size_bytes: typeof payload.size_bytes === "number" ? payload.size_bytes : null,
    modified_at: typeof payload.modified_at === "string" ? payload.modified_at : null,
  };
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
        .map((item) => String(item))
    : [];
}

function normalizeRun(value: unknown): PriceMonitoringRun | null {
  if (!isRecord(value)) {
    return null;
  }

  return value as PriceMonitoringRun;
}

function normalizeRunList(payload: unknown): PriceMonitoringRun[] {
  return getArrayPayload(payload, ["runs", "items", "data", "results"])
    .map(normalizeRun)
    .filter((run): run is PriceMonitoringRun => run !== null);
}

function normalizeReviewItem(value: unknown): PriceMonitoringReviewItem | null {
  if (!isRecord(value) || typeof value.model !== "string") {
    return null;
  }

  return {
    ...value,
    model: value.model,
    warnings: normalizeStringArray(value.warnings),
  } as PriceMonitoringReviewItem;
}

function normalizeReview(payload: unknown): PriceMonitoringReviewResponse {
  if (!isRecord(payload)) {
    return {
      items: [],
    };
  }

  return {
    ...payload,
    run_id: typeof payload.run_id === "string" || typeof payload.run_id === "number" ? payload.run_id : null,
    items: getArrayPayload(payload.items, [])
      .map(normalizeReviewItem)
      .filter((item): item is PriceMonitoringReviewItem => item !== null),
    summary: isRecord(payload.summary) ? (payload.summary as Record<string, number>) : {},
    review_csv_path: normalizeArtifactPathValue(payload.review_csv_path),
    enriched_csv_path: normalizeArtifactPathValue(payload.enriched_csv_path),
  };
}

function normalizeFetchResult(payload: unknown): FetchPriceMonitoringResult {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    ...payload,
    input_csv_path: normalizeArtifactPathValue(payload.input_csv_path),
    enriched_csv_path: normalizeArtifactPathValue(payload.enriched_csv_path),
    fetch_summary_path: normalizeArtifactPathValue(payload.fetch_summary_path),
    fetch_result_path: normalizeArtifactPathValue(payload.fetch_result_path),
    warnings: normalizeStringArray(payload.warnings),
    persistence_warnings: normalizeStringArray(payload.persistence_warnings),
  };
}

function normalizeDbStatus(payload: unknown): PriceMonitoringDbStatus {
  if (!isRecord(payload)) {
    return {
      configured: false,
      reachable: false,
      dialect: null,
      error: null,
    };
  }

  return {
    configured: payload.configured === true,
    reachable: payload.reachable === true,
    dialect:
      typeof payload.dialect === "string" || payload.dialect === null
        ? payload.dialect
        : null,
    error:
      typeof payload.error === "string" || payload.error === null
        ? payload.error
        : null,
  };
}

function normalizePriceObservation(value: unknown): PriceObservation | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
    raw_observation: isRecord(value.raw_observation) ? value.raw_observation : null,
  } as PriceObservation;
}

function normalizePriceObservationsResponse(payload: unknown): PriceObservationsResponse {
  const source = isRecord(payload) ? payload : {};
  const items = getArrayPayload(payload, ["items", "observations", "data", "results"])
    .map(normalizePriceObservation)
    .filter((item): item is PriceObservation => item !== null);

  return {
    items,
    limit: toNumber(source.limit, items.length),
    offset: toNumber(source.offset, 0),
    count: toNumber(source.count, items.length),
  };
}

function normalizeRunPriceObservationsResponse(payload: unknown): RunPriceObservationsResponse {
  const source = isRecord(payload) ? payload : {};
  const response = normalizePriceObservationsResponse(payload);

  return {
    run_id:
      typeof source.run_id === "string" || typeof source.run_id === "number"
        ? source.run_id
        : null,
    items: response.items,
    count: response.count,
    matched_count: toNumber(source.matched_count, response.items.filter((item) => item.is_matched === true).length),
    unmatched_count: toNumber(
      source.unmatched_count,
      response.items.filter((item) => item.is_matched !== true && item.match_status !== "matched").length,
    ),
  };
}

function normalizeCatalogSnapshot(value: unknown): CatalogSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
    raw_catalog_row: isRecord(value.raw_catalog_row) ? value.raw_catalog_row : null,
  } as CatalogSnapshot;
}

function normalizeCatalogSnapshotResponse(payload: unknown): CatalogSnapshotResponse {
  const source = isRecord(payload) ? payload : {};
  const items = getArrayPayload(payload, ["items", "catalog_snapshot", "data", "results"])
    .map(normalizeCatalogSnapshot)
    .filter((item): item is CatalogSnapshot => item !== null);

  return {
    run_id:
      typeof source.run_id === "string" || typeof source.run_id === "number"
        ? source.run_id
        : null,
    items,
    count: toNumber(source.count, items.length),
  };
}

function normalizePriceHistoryResponse(payload: unknown): PriceHistoryResponse {
  const source = isRecord(payload) ? payload : {};
  const response = normalizePriceObservationsResponse(payload);

  return {
    product_id:
      typeof source.product_id === "string" || typeof source.product_id === "number"
        ? source.product_id
        : null,
    model: typeof source.model === "string" ? source.model : null,
    catalog_source: typeof source.catalog_source === "string" ? source.catalog_source : null,
    items: response.items,
    count: response.count,
  };
}

function normalizeApplyReviewActionsResult(payload: unknown): ApplyPriceMonitoringReviewActionsResult {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    ...payload,
    review_csv_path: normalizeArtifactPathValue(payload.review_csv_path),
    review_actions_path: normalizeArtifactPathValue(payload.review_actions_path),
    summary: isRecord(payload.summary) ? payload.summary : undefined,
  } as ApplyPriceMonitoringReviewActionsResult;
}

function normalizeExportPriceUpdateResult(payload: unknown): ExportPriceMonitoringPriceUpdateResult {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    ...payload,
    output_path: normalizeArtifactPathValue(payload.output_path),
    columns: normalizeStringArray(payload.columns),
  };
}

function isArtifactPathForbidden(path: string, status: number): boolean {
  if (status !== 403) {
    return false;
  }

  return (
    path.startsWith("/artifacts/") ||
    path.includes("/review") ||
    path.includes("/export-price-update")
  );
}

async function request<T>(path: string, options: CommerceRequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${commerceApiBaseUrl}${path}`, {
      ...options,
      headers: buildHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    throw new CommerceApiError(
      `Commerce API unreachable at ${path}. Start pricefetcher-api on 127.0.0.1:8001.`,
      0,
      rawMessage,
      path,
    );
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const backendMessage = getPayloadMessage(payload) ?? response.statusText;
    const pathHint = isArtifactPathForbidden(path, response.status)
      ? " Path is outside configured artifact roots. Add the directory to PRICEFETCHER_ARTIFACT_ROOTS and restart the backend."
      : "";
    const setupHint =
      response.status === 404 && path.startsWith("/catalog/")
        ? " If the API is running, check that sourceCata.csv exists at C:\\Users\\user\\Downloads\\sourceCata.csv or set PRICEFETCHER_SOURCE_CATA_PATH."
        : "";
    const dbHint =
      response.status === 503 && path.startsWith("/price-monitoring/")
        ? " Price monitoring DB persistence may be disabled or unreachable."
        : "";
    const message = `Commerce API ${response.status} at ${path}: ${backendMessage}${pathHint}${setupHint}${dbHint}`;
    throw new CommerceApiError(message, response.status, payload, path);
  }

  return payload as T;
}

function normalizeCatalogCategoryOptions(payload: unknown): CatalogCategoryOption[] {
  const list = getArrayPayload(payload, ["items", "categories", "data", "results"]);

  return list
    .map<CatalogCategoryOption | null>((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return { category: String(item), count: null };
      }

      if (!isRecord(item)) {
        return null;
      }

      const category = item.category ?? item.name ?? item.value;
      if (typeof category !== "string" && typeof category !== "number") {
        return null;
      }

      return {
        category: String(category),
        count: typeof item.count === "number" ? item.count : null,
      };
    })
    .filter((item): item is CatalogCategoryOption => item !== null && item.category.length > 0);
}

function normalizeCatalogSubCategoryNode(value: unknown): CatalogSubCategoryNode | null {
  if (!isRecord(value)) {
    return null;
  }

  const subCategory = value.sub_category ?? value.name ?? value.value ?? "";
  if (typeof subCategory !== "string" && typeof subCategory !== "number") {
    return null;
  }

  return {
    sub_category: String(subCategory),
    count: typeof value.count === "number" ? value.count : null,
    raw_categories: normalizeStringArray(value.raw_categories),
  };
}

function normalizeCatalogCategoryNode(value: unknown): CatalogCategoryNode | null {
  if (!isRecord(value)) {
    return null;
  }

  const categoryName = value.category_name ?? value.category ?? value.name ?? value.value;
  if (typeof categoryName !== "string" && typeof categoryName !== "number") {
    return null;
  }

  return {
    category_name: String(categoryName),
    count: typeof value.count === "number" ? value.count : null,
    sub_categories: getArrayPayload(value.sub_categories, ["items", "data", "results"])
      .map(normalizeCatalogSubCategoryNode)
      .filter((item): item is CatalogSubCategoryNode => item !== null),
  };
}

function normalizeCatalogFamilyNode(value: unknown): CatalogFamilyNode | null {
  if (!isRecord(value)) {
    return null;
  }

  const family = value.family ?? value.name ?? value.value;
  if (typeof family !== "string" && typeof family !== "number") {
    return null;
  }

  return {
    family: String(family),
    count: typeof value.count === "number" ? value.count : null,
    categories: getArrayPayload(value.categories, ["items", "data", "results"])
      .map(normalizeCatalogCategoryNode)
      .filter((item): item is CatalogCategoryNode => item !== null),
  };
}

function normalizeCatalogCategoryHierarchy(payload: unknown): CatalogCategoryHierarchyResponse {
  return {
    items: getArrayPayload(payload, ["items", "families", "data", "results"])
      .map(normalizeCatalogFamilyNode)
      .filter((item): item is CatalogFamilyNode => item !== null && item.family.trim().length > 0),
  };
}

function normalizeCatalogBrandOptions(payload: unknown): CatalogBrandOption[] {
  const list = getArrayPayload(payload, ["items", "brands", "manufacturers", "data", "results"]);

  return list
    .map<CatalogBrandOption | null>((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return { manufacturer: String(item), count: null };
      }

      if (!isRecord(item)) {
        return null;
      }

      const manufacturer = item.manufacturer ?? item.brand ?? item.name ?? item.value;
      if (typeof manufacturer !== "string" && typeof manufacturer !== "number") {
        return null;
      }

      return {
        manufacturer: String(manufacturer),
        count: typeof item.count === "number" ? item.count : null,
      };
    })
    .filter((item): item is CatalogBrandOption => item !== null && item.manufacturer.length > 0);
}

export const commerceClient = {
  commerceApiBaseUrl,

  getCommerceHealth(signal?: AbortSignal): Promise<unknown> {
    return request<unknown>("/health", { signal });
  },

  async listCatalogProducts(
    params: CatalogProductsParams = {},
    signal?: AbortSignal,
  ): Promise<CatalogProductsResponse> {
    return normalizeProductsResponse(
      await request<unknown>(appendQuery("/catalog/products", params as QueryParams), { signal }),
    );
  },

  async listCatalogCategories(signal?: AbortSignal): Promise<string[]> {
    const payload = await request<unknown>("/catalog/categories", { signal });
    const options = normalizeCatalogCategoryOptions(payload);
    return options.length > 0 ? options.map((item) => item.category) : normalizeStringList(payload);
  },

  async listCatalogBrands(signal?: AbortSignal): Promise<string[]> {
    const payload = await request<unknown>("/catalog/brands", { signal });
    const options = normalizeCatalogBrandOptions(payload);
    return options.length > 0 ? options.map((item) => item.manufacturer) : normalizeStringList(payload);
  },

  async listCatalogCategoryOptions(signal?: AbortSignal): Promise<CatalogCategoryOption[]> {
    return normalizeCatalogCategoryOptions(await request<unknown>("/catalog/categories", { signal }));
  },

  async getCatalogCategoryHierarchy(signal?: AbortSignal): Promise<CatalogCategoryHierarchyResponse> {
    return normalizeCatalogCategoryHierarchy(
      await request<unknown>("/catalog/category-hierarchy", { signal }),
    );
  },

  async listCatalogBrandOptions(signal?: AbortSignal): Promise<CatalogBrandOption[]> {
    return normalizeCatalogBrandOptions(await request<unknown>("/catalog/brands", { signal }));
  },

  async getCatalogSummary(signal?: AbortSignal): Promise<CatalogSummary> {
    const summary = await request<unknown>("/catalog/summary", { signal });
    return isRecord(summary) ? summary : {};
  },

  async getArtifactRoots(signal?: AbortSignal): Promise<ArtifactRoot[]> {
    return normalizeArtifactRoots(await request<unknown>("/artifacts/roots", { signal }));
  },

  async getPathRoots(signal?: AbortSignal): Promise<PathRootsResponse> {
    return normalizePathRoots(await request<unknown>("/paths/roots", { signal }));
  },

  async listBridgeRunArtifacts(
    runId: string,
    signal?: AbortSignal,
  ): Promise<ArtifactListResponse> {
    return normalizeArtifactList(
      await request<unknown>(`/artifacts/bridge/runs/${encodeURIComponent(runId)}`, {
        signal,
      }),
    );
  },

  async listPriceMonitoringRunArtifacts(
    runId: string,
    signal?: AbortSignal,
  ): Promise<ArtifactListResponse> {
    return normalizeArtifactList(
      await request<unknown>(`/artifacts/price-monitoring/runs/${encodeURIComponent(runId)}`, {
        signal,
      }),
    );
  },

  async readArtifact(
    path: string,
    maxBytes?: number,
    signal?: AbortSignal,
  ): Promise<ArtifactReadResponse> {
    return normalizeArtifactRead(
      await request<unknown>(
        appendQuery("/artifacts/read", {
          path,
          max_bytes: maxBytes,
        }),
        { signal },
      ),
    );
  },

  getArtifactDownloadUrl(path: string): string {
    return toCommerceArtifactUrl(path);
  },

  previewPriceMonitoringSelection(
    body: PriceMonitoringSelectionBody,
    signal?: AbortSignal,
  ): Promise<PriceMonitoringSelectionResult> {
    return request<PriceMonitoringSelectionResult>("/price-monitoring/selection/preview", {
      method: "POST",
      body,
      signal,
    });
  },

  createPriceMonitoringRun(
    body: PriceMonitoringSelectionBody,
    signal?: AbortSignal,
  ): Promise<PriceMonitoringSelectionResult> {
    return request<PriceMonitoringSelectionResult>("/price-monitoring/runs", {
      method: "POST",
      body,
      signal,
    });
  },

  async listPriceMonitoringRuns(signal?: AbortSignal): Promise<PriceMonitoringRun[]> {
    return normalizeRunList(await request<unknown>("/price-monitoring/runs", { signal }));
  },

  async getPriceMonitoringRun(
    runId: string,
    signal?: AbortSignal,
  ): Promise<PriceMonitoringRun> {
    const run = normalizeRun(
      await request<unknown>(`/price-monitoring/runs/${encodeURIComponent(runId)}`, { signal }),
    );
    return run ?? {};
  },

  async fetchPriceMonitoringRun(
    runId: string,
    body: FetchPriceMonitoringBody,
    signal?: AbortSignal,
  ): Promise<FetchPriceMonitoringResult> {
    return normalizeFetchResult(
      await request<unknown>(`/price-monitoring/runs/${encodeURIComponent(runId)}/fetch`, {
        method: "POST",
        body,
        signal,
      }),
    );
  },

  async getPriceMonitoringFetchResult(
    runId: string,
    signal?: AbortSignal,
  ): Promise<FetchPriceMonitoringResult> {
    return normalizeFetchResult(
      await request<unknown>(`/price-monitoring/runs/${encodeURIComponent(runId)}/fetch`, {
        signal,
      }),
    );
  },

  async getPriceMonitoringDbStatus(signal?: AbortSignal): Promise<PriceMonitoringDbStatus> {
    return normalizeDbStatus(
      await request<unknown>("/price-monitoring/db/status", { signal }),
    );
  },

  async listPriceMonitoringObservations(
    params: PriceObservationsParams = {},
    signal?: AbortSignal,
  ): Promise<PriceObservationsResponse> {
    return normalizePriceObservationsResponse(
      await request<unknown>(
        appendQuery("/price-monitoring/observations", params as QueryParams),
        { signal },
      ),
    );
  },

  async getPriceMonitoringRunObservations(
    runId: string,
    params: { include_unmatched?: boolean; limit?: number; offset?: number } = {},
    signal?: AbortSignal,
  ): Promise<RunPriceObservationsResponse> {
    return normalizeRunPriceObservationsResponse(
      await request<unknown>(
        appendQuery(
          `/price-monitoring/runs/${encodeURIComponent(runId)}/observations`,
          params,
        ),
        { signal },
      ),
    );
  },

  async getPriceMonitoringRunCatalogSnapshot(
    runId: string,
    signal?: AbortSignal,
  ): Promise<CatalogSnapshotResponse> {
    return normalizeCatalogSnapshotResponse(
      await request<unknown>(
        `/price-monitoring/runs/${encodeURIComponent(runId)}/catalog-snapshot`,
        { signal },
      ),
    );
  },

  async getPriceMonitoringProductPriceHistory(
    productId: string | number,
    signal?: AbortSignal,
  ): Promise<PriceHistoryResponse> {
    return normalizePriceHistoryResponse(
      await request<unknown>(
        `/price-monitoring/products/${encodeURIComponent(String(productId))}/price-history`,
        { signal },
      ),
    );
  },

  async getPriceMonitoringModelPriceHistory(
    model: string,
    params: { catalog_source?: string | null; include_unmatched?: boolean } = {},
    signal?: AbortSignal,
  ): Promise<PriceHistoryResponse> {
    return normalizePriceHistoryResponse(
      await request<unknown>(
        appendQuery(
          `/price-monitoring/products/by-model/${encodeURIComponent(model)}/price-history`,
          params,
        ),
        { signal },
      ),
    );
  },

  async getPriceMonitoringReview(
    runId: string,
    params: PriceMonitoringReviewParams = {},
    signal?: AbortSignal,
  ): Promise<PriceMonitoringReviewResponse> {
    return normalizeReview(
      await request<unknown>(
        appendQuery(`/price-monitoring/runs/${encodeURIComponent(runId)}/review`, {
          enriched_csv_path: params.enriched_csv_path,
        }),
        { signal },
      ),
    );
  },

  applyPriceMonitoringReviewActions(
    runId: string,
    body: ApplyPriceMonitoringReviewActionsBody,
    signal?: AbortSignal,
  ): Promise<ApplyPriceMonitoringReviewActionsResult> {
    return request<unknown>(
      `/price-monitoring/runs/${encodeURIComponent(runId)}/review/actions`,
      {
        method: "POST",
        body,
        signal,
      },
    ).then(normalizeApplyReviewActionsResult);
  },

  exportPriceMonitoringPriceUpdate(
    runId: string,
    body: ExportPriceMonitoringPriceUpdateBody,
    signal?: AbortSignal,
  ): Promise<ExportPriceMonitoringPriceUpdateResult> {
    return request<unknown>(
      `/price-monitoring/runs/${encodeURIComponent(runId)}/export-price-update`,
      {
        method: "POST",
        body,
        signal,
      },
    ).then(normalizeExportPriceUpdateResult);
  },

  async getFileRoots(signal?: AbortSignal): Promise<FileRoot[]> {
    return normalizeFileRoots(await request<unknown>("/files/roots", { signal }));
  },

  async listFiles(params: FileListParams, signal?: AbortSignal): Promise<FileListResponse> {
    return normalizeFileList(
      await request<unknown>(
        appendQuery("/files/list", {
          root: params.root,
          relative_path: params.relative_path,
        }),
        { signal },
      ),
    );
  },

  async readCsvFile(
    body: ReadCsvFileBody,
    signal?: AbortSignal,
  ): Promise<ReadCsvFileResponse> {
    return normalizeCsvRead(
      await request<unknown>("/files/read", {
        method: "POST",
        body,
        signal,
      }),
    );
  },

  saveCsvFile(body: SaveCsvFileBody, signal?: AbortSignal): Promise<SaveCsvResponse> {
    return request<SaveCsvResponse>("/files/save", {
      method: "POST",
      body,
      signal,
    });
  },

  saveCsvCopy(body: SaveCsvCopyBody, signal?: AbortSignal): Promise<SaveCsvResponse> {
    return request<SaveCsvResponse>("/files/save-copy", {
      method: "POST",
      body,
      signal,
    });
  },

  runBridge(body: BridgeRunBody, signal?: AbortSignal): Promise<BridgeRunResponse> {
    return request<BridgeRunResponse>("/bridge/run", {
      method: "POST",
      body,
      signal,
    });
  },
};
