import { apiClient } from "../api/client";
import { ModelJobForm } from "../components/forms/ModelJobForm";
import { useCreateJob } from "../hooks/useCreateJob";

export function PublishJobPage() {
  const { error, isSubmitting, submitJob } = useCreateJob(apiClient.createPublishJob);

  return (
    <div className="page-stack narrow">
      <section className="page-header">
        <p className="eyebrow">Publish</p>
        <h2>Start publish job</h2>
      </section>
      <section className="panel">
        <ModelJobForm
          actionLabel="Start publish job"
          busyLabel="Starting publish job..."
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={submitJob}
        />
      </section>
    </div>
  );
}
