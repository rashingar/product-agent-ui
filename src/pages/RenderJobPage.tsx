import { apiClient } from "../api/client";
import { ModelJobForm } from "../components/forms/ModelJobForm";
import { useCreateJob } from "../hooks/useCreateJob";

export function RenderJobPage() {
  const { error, isSubmitting, submitJob } = useCreateJob(apiClient.createRenderJob);

  return (
    <div className="page-stack narrow">
      <section className="page-header">
        <p className="eyebrow">Render</p>
        <h2>Start render job</h2>
      </section>
      <section className="panel">
        <ModelJobForm
          actionLabel="Start render job"
          busyLabel="Starting render job..."
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={submitJob}
        />
      </section>
    </div>
  );
}
