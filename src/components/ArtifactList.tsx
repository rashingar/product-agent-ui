import { useState } from "react";
import type { ArtifactItem } from "../api/commerceTypes";
import { EmptyState } from "./layout/StateBlocks";

interface ArtifactListProps {
  title: string;
  items: ArtifactItem[];
  onPreview: (path: string) => Promise<string>;
  getDownloadUrl: (path: string) => string;
}

const TEXT_EXTENSIONS = new Set([".csv", ".json", ".txt", ".log"]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatSize(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  if (value < 1024) {
    return `${value.toLocaleString()} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`;
  }

  return `${(value / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

function getExtension(item: ArtifactItem): string {
  if (item.extension) {
    return item.extension.toLowerCase();
  }

  const dotIndex = item.name.lastIndexOf(".");
  return dotIndex >= 0 ? item.name.slice(dotIndex).toLowerCase() : "";
}

export function ArtifactList({
  title,
  items,
  onPreview,
  getDownloadUrl,
}: ArtifactListProps) {
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const preview = async (item: ArtifactItem) => {
    setIsPreviewLoading(true);
    setPreviewTitle(item.name);
    setPreviewContent(null);
    setPreviewError(null);

    try {
      setPreviewContent(await onPreview(item.path));
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <div className="artifact-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Artifacts</p>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No artifacts yet" message="The backend returned no artifacts for this run." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Extension</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const extension = getExtension(item);
                const canPreview = TEXT_EXTENSIONS.has(extension);
                const downloadPath = item.download_url || item.path;

                return (
                  <tr key={`${item.path}-${index}`}>
                    <td>
                      <strong>{item.name}</strong>
                      <small className="artifact-path">{item.path}</small>
                    </td>
                    <td>{formatValue(extension)}</td>
                    <td>{formatSize(item.size_bytes)}</td>
                    <td>{formatValue(item.modified_at)}</td>
                    <td>
                      <div className="button-row">
                        <button
                          className="button secondary"
                          type="button"
                          disabled={!canPreview || isPreviewLoading}
                          onClick={() => void preview(item)}
                        >
                          Preview
                        </button>
                        <a
                          className="button secondary"
                          href={getDownloadUrl(downloadPath)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {previewTitle ? (
        <div className="artifact-preview">
          <div className="section-heading">
            <strong>{previewTitle}</strong>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setPreviewTitle(null);
                setPreviewContent(null);
                setPreviewError(null);
              }}
            >
              Close
            </button>
          </div>
          {isPreviewLoading ? <p className="muted">Loading preview...</p> : null}
          {previewError ? <p className="form-error">{previewError}</p> : null}
          {previewContent !== null ? <pre className="json-block">{previewContent}</pre> : null}
        </div>
      ) : null}
    </div>
  );
}
