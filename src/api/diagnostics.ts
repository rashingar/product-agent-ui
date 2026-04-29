import { apiClient } from "./client";
import { commerceClient } from "./commerceClient";

export type DiagnosticStatus = "ok" | "warning" | "error";

export interface DiagnosticResult {
  service: string;
  requestUrl: string;
  status: DiagnosticStatus;
  httpStatus?: number;
  message: string;
  rawError?: string;
  suggestedFix: string;
}

export interface ApiDiagnostics {
  productAgentBaseUrl: string;
  commerceBaseUrl: string;
  productAgentProxyTarget: string;
  commerceProxyTarget: string;
  results: DiagnosticResult[];
}

const DEFAULT_PRODUCT_AGENT_PROXY_TARGET = "http://127.0.0.1:8000";
const DEFAULT_COMMERCE_PROXY_TARGET = "http://127.0.0.1:8001";

export const productAgentProxyTarget =
  import.meta.env.VITE_API_PROXY_TARGET || DEFAULT_PRODUCT_AGENT_PROXY_TARGET;
export const commerceProxyTarget =
  import.meta.env.VITE_COMMERCE_API_PROXY_TARGET || DEFAULT_COMMERCE_PROXY_TARGET;

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return normalizedBase.length > 0 ? `${normalizedBase}${path}` : path;
}

async function parseResponseMessage(response: Response): Promise<string | null> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return null;
  }

  try {
    const payload = JSON.parse(text) as unknown;
    if (typeof payload === "string") {
      return payload;
    }

    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      for (const key of ["detail", "message", "error"]) {
        const value = record[key];
        if (typeof value === "string") {
          return value;
        }

        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
      }
    }
  } catch {
    return text;
  }

  return text;
}

async function checkEndpoint({
  service,
  requestUrl,
  okMessage,
  warningStatuses = [],
  errorSuggestion,
  warningSuggestion,
}: {
  service: string;
  requestUrl: string;
  okMessage: string;
  warningStatuses?: number[];
  errorSuggestion: string;
  warningSuggestion?: string;
}): Promise<DiagnosticResult> {
  try {
    const response = await fetch(requestUrl);
    const backendMessage = response.ok ? null : await parseResponseMessage(response);

    if (response.ok) {
      return {
        service,
        requestUrl,
        status: "ok",
        httpStatus: response.status,
        message: okMessage,
        suggestedFix: "No action needed.",
      };
    }

    const status: DiagnosticStatus = warningStatuses.includes(response.status)
      ? "warning"
      : "error";

    return {
      service,
      requestUrl,
      status,
      httpStatus: response.status,
      message: backendMessage
        ? `HTTP ${response.status}: ${backendMessage}`
        : `HTTP ${response.status}`,
      suggestedFix: status === "warning" && warningSuggestion ? warningSuggestion : errorSuggestion,
    };
  } catch (error) {
    return {
      service,
      requestUrl,
      status: "error",
      message: "Request failed before a backend response was received.",
      rawError: error instanceof Error ? error.message : String(error),
      suggestedFix: errorSuggestion,
    };
  }
}

export function checkProductAgentApi(): Promise<DiagnosticResult> {
  return checkEndpoint({
    service: "Product-Agent API",
    requestUrl: joinUrl(apiClient.apiBaseUrl, "/api/health"),
    okMessage: "Product-Agent API health endpoint responded.",
    errorSuggestion:
      "Start the Product-Agent API on 127.0.0.1:8000 and confirm VITE_API_PROXY_TARGET=http://127.0.0.1:8000.",
  });
}

export async function checkCommerceApi(): Promise<DiagnosticResult[]> {
  const healthUrl = joinUrl(commerceClient.commerceApiBaseUrl, "/health");
  const summaryUrl = joinUrl(commerceClient.commerceApiBaseUrl, "/catalog/summary");
  const rootsUrl = joinUrl(commerceClient.commerceApiBaseUrl, "/files/roots");
  const artifactRootsUrl = joinUrl(commerceClient.commerceApiBaseUrl, "/artifacts/roots");

  const [healthResult, summaryResult, fileRootsResult, artifactRootsResult] = await Promise.all([
    checkEndpoint({
      service: "Commerce API health",
      requestUrl: healthUrl,
      okMessage: "Commerce API health endpoint responded.",
      errorSuggestion:
        "Commerce API is not reachable. Start price-fetcher with pricefetcher-api or python -m pricefetcher.api.app.",
    }),
    checkEndpoint({
      service: "Commerce API catalog summary",
      requestUrl: summaryUrl,
      okMessage: "Commerce catalog summary responded.",
      errorSuggestion:
        "Confirm sourceCata.csv exists at C:\\Users\\user\\Downloads\\sourceCata.csv or set PRICEFETCHER_SOURCE_CATA_PATH.",
    }),
    checkEndpoint({
      service: "Commerce API file roots",
      requestUrl: rootsUrl,
      okMessage: "Commerce file roots responded.",
      errorSuggestion:
        "Start pricefetcher-api and check PRICEFETCHER_FILE_ROOTS if expected safe folders are missing.",
    }),
    checkEndpoint({
      service: "Commerce API artifact roots",
      requestUrl: artifactRootsUrl,
      okMessage: "Commerce artifact roots responded.",
      errorSuggestion:
        "Start the latest price-fetcher backend and check artifact root configuration.",
    }),
  ]);

  if (healthResult.status === "ok" && summaryResult.status !== "ok") {
    summaryResult.message =
      "Commerce API is running, but catalog loading failed. Check sourceCata.csv path or PRICEFETCHER_SOURCE_CATA_PATH.";
    summaryResult.suggestedFix =
      "Check sourceCata.csv path or PRICEFETCHER_SOURCE_CATA_PATH.";
  }

  return [healthResult, summaryResult, fileRootsResult, artifactRootsResult];
}

export async function runApiDiagnostics(): Promise<ApiDiagnostics> {
  const [productAgentResult, commerceResults] = await Promise.all([
    checkProductAgentApi(),
    checkCommerceApi(),
  ]);

  return {
    productAgentBaseUrl: apiClient.apiBaseUrl || "/api via Vite proxy",
    commerceBaseUrl: commerceClient.commerceApiBaseUrl,
    productAgentProxyTarget,
    commerceProxyTarget,
    results: [productAgentResult, ...commerceResults],
  };
}
