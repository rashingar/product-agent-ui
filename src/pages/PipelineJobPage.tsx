import { Link } from "react-router-dom";
import { getJobIdentifier, getJobStatus } from "../api/jobUtils";
import { PrepareJobForm } from "../components/forms/PrepareJobForm";
import { StatusBadge } from "../components/jobs/StatusBadge";
import { ErrorState } from "../components/layout/StateBlocks";
import { usePipelineRun } from "../hooks/usePipelineRun";

export function PipelineJobPage() {
  const { currentRun, isRunning, startPipeline } = usePipelineRun();

  return (
    <div className="page-stack narrow">
      <section className="page-header">
        <p className="eyebrow">Pipeline</p>
        <h2>Run full pipeline</h2>
        <p>Queues prepare, waits for success, then queues render and publish.</p>
      </section>

      {currentRun ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current run</p>
              <h3>{currentRun.status}</h3>
            </div>
            <span className="muted">Started {currentRun.startedAt.toLocaleTimeString()}</span>
          </div>

          {currentRun.error ? <ErrorState message={currentRun.error} /> : null}

          <ol className="pipeline-stage-list">
            {currentRun.stages.map((stage) => {
              const jobId = stage.job ? getJobIdentifier(stage.job) : undefined;
              return (
                <li key={stage.key} className="pipeline-stage-item">
                  <div>
                    <strong>{stage.label}</strong>
                    {jobId ? (
                      <Link to={`/jobs/${encodeURIComponent(jobId)}`}>{jobId}</Link>
                    ) : (
                      <span className="muted">No job yet</span>
                    )}
                  </div>
                  <StatusBadge status={stage.job ? getJobStatus(stage.job) : stage.status} />
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="panel">
        <PrepareJobForm
          actionLabel="Run full pipeline"
          busyLabel="Pipeline is running..."
          error={currentRun?.status === "failed" ? currentRun.error : null}
          isSubmitting={isRunning}
          onSubmit={(request) => void startPipeline(request)}
        />
      </section>
    </div>
  );
}
