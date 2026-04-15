import { Link, useParams } from "react-router-dom";
import { getRequestPayload } from "../api/jobUtils";
import { ArtifactList } from "../components/jobs/ArtifactList";
import { JobSummary } from "../components/jobs/JobSummary";
import { JsonBlock } from "../components/jobs/JsonBlock";
import { LogsPanel } from "../components/jobs/LogsPanel";
import { ErrorState, LoadingState } from "../components/layout/StateBlocks";
import { useJobDetail } from "../hooks/useJobDetail";

export function JobDetailPage() {
  const { jobId } = useParams();
  const {
    artifacts,
    error,
    isLoading,
    isPolling,
    isRefreshing,
    job,
    lastLoadedAt,
    logs,
    reload,
  } = useJobDetail(jobId);

  return (
    <div className="page-stack">
      <section className="page-header">
        <Link to="/jobs" className="back-link">
          Back to jobs
        </Link>
        <p className="eyebrow">Job detail</p>
        <h2>{jobId ?? "Unknown job"}</h2>
        <p>
          {isPolling
            ? "Polling this job every 2.5 seconds."
            : "Polling stopped for this job."}
        </p>
      </section>

      <div className="toolbar">
        {lastLoadedAt ? (
          <span className="muted">Last loaded {lastLoadedAt.toLocaleTimeString()}</span>
        ) : null}
        <button className="button secondary" type="button" onClick={() => void reload()}>
          Refresh
        </button>
      </div>

      {isLoading ? <LoadingState label="Loading job..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}

      {!isLoading && job ? (
        <>
          <JobSummary job={job} isPolling={isPolling} isRefreshing={isRefreshing} />

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Request payload</p>
                <h3>Submitted input</h3>
              </div>
            </div>
            <JsonBlock value={getRequestPayload(job)} />
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Logs</p>
                <h3>{logs.length} entries</h3>
              </div>
            </div>
            <LogsPanel logs={logs} />
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Artifacts</p>
                <h3>{artifacts.length} items</h3>
              </div>
            </div>
            <ArtifactList artifacts={artifacts} />
          </section>
        </>
      ) : null}
    </div>
  );
}
