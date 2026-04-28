import type {
  BridgeRunBody,
  BridgeRunResponse,
  CatalogProduct,
  CatalogProductsParams,
  CatalogProductsResponse,
  CatalogSummary,
  FileListParams,
  FileListResponse,
  FileListItem,
  FileRoot,
  PriceMonitoringSelectionBody,
  PriceMonitoringSelectionResult,
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

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
    this.details = details;
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

async function request<T>(path: string, options: CommerceRequestOptions = {}): Promise<T> {
  const response = await fetch(`${commerceApiBaseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      getPayloadMessage(payload) ?? `Commerce API request failed with ${response.status}`;
    throw new CommerceApiError(message, response.status, payload);
  }

  return payload as T;
}

export const commerceClient = {
  commerceApiBaseUrl,

  async listCatalogProducts(
    params: CatalogProductsParams = {},
    signal?: AbortSignal,
  ): Promise<CatalogProductsResponse> {
    return normalizeProductsResponse(
      await request<unknown>(appendQuery("/catalog/products", params as QueryParams), { signal }),
    );
  },

  async listCatalogCategories(signal?: AbortSignal): Promise<string[]> {
    return normalizeStringList(await request<unknown>("/catalog/categories", { signal }));
  },

  async listCatalogBrands(signal?: AbortSignal): Promise<string[]> {
    return normalizeStringList(await request<unknown>("/catalog/brands", { signal }));
  },

  async getCatalogSummary(signal?: AbortSignal): Promise<CatalogSummary> {
    const summary = await request<unknown>("/catalog/summary", { signal });
    return isRecord(summary) ? summary : {};
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
