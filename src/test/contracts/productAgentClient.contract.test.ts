import { describe, expect, it } from "vitest";
import { ApiError, apiClient } from "../../api/client";
import { installMockFetch } from "../mockFetch";
import {
  productAgentConflictError,
  productAgentFixtureRoutes,
  productAgentJobs,
  productAgentValidationError,
} from "../fixtures/productAgentApi";

describe("Product-Agent API client contract fixtures", () => {
  it("passes through health responses", async () => {
    installMockFetch(productAgentFixtureRoutes);

    await expect(apiClient.getHealth()).resolves.toMatchObject({
      status: "ok",
      service: "product-agent",
    });
  });

  it("normalizes wrapped and direct job list shapes", async () => {
    installMockFetch([
      { method: "GET", path: "/api/jobs", response: { jobs: productAgentJobs } },
    ]);
    await expect(apiClient.listJobs()).resolves.toHaveLength(productAgentJobs.length);

    installMockFetch([{ method: "GET", path: "/api/jobs", response: productAgentJobs }]);
    await expect(apiClient.listJobs()).resolves.toEqual(productAgentJobs);
  });

  it("preserves terminal job statuses", async () => {
    installMockFetch(productAgentFixtureRoutes);

    const jobs = await apiClient.listJobs();
    expect(jobs.map((job) => job.status)).toEqual(
      expect.arrayContaining(["succeeded", "failed", "cancelled", "killed"]),
    );
  });

  it("normalizes job detail logs and artifacts from backend wrapper shapes", async () => {
    installMockFetch(productAgentFixtureRoutes);

    await expect(apiClient.getJob("job-succeeded-1")).resolves.toMatchObject({
      job_id: "job-succeeded-1",
      status: "succeeded",
    });
    await expect(apiClient.getJobLogs("job-succeeded-1")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Render succeeded" })]),
    );
    await expect(apiClient.getJobArtifacts("job-succeeded-1")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "product-page.html" })]),
    );
  });

  it("normalizes settings filter categories details and sync report", async () => {
    installMockFetch(productAgentFixtureRoutes);

    await expect(apiClient.getSettings()).resolves.toMatchObject({
      authoring: { intro_text: { default: { min_words: 80 } } },
    });

    await expect(apiClient.getFilterStatus()).resolves.toMatchObject({
      status: "ready",
      category_count: 2,
    });

    const categories = await apiClient.listFilterCategories();
    expect(categories[0]).toMatchObject({
      category_id: 310,
      leaf_category: "Αφυγραντήρες",
    });

    const category = await apiClient.getFilterCategory(310);
    expect(category).toMatchObject({ category_id: 310 });
    expect(category.groups).toEqual(
      expect.arrayContaining([expect.objectContaining({ group_id: "grp-capacity" })]),
    );

    await expect(apiClient.getFilterSyncReport()).resolves.toMatchObject({
      mode: "mocked",
      warnings: [expect.objectContaining({ category_id: 310 })],
    });
  });

  it("normalizes authoring and filter review responses for leading-zero models", async () => {
    installMockFetch(productAgentFixtureRoutes);

    await expect(apiClient.getAuthoringStatus("005606")).resolves.toMatchObject({
      model: "005606",
      ready_for_render: true,
    });
    await expect(apiClient.getFilterReview("005606")).resolves.toMatchObject({
      model: "005606",
      category_id: 310,
      groups: [expect.objectContaining({ group_name: "Χωρητικότητα" })],
    });
  });

  it("exposes useful API error messages for 409 and 422 responses", async () => {
    installMockFetch([
      { method: "POST", path: "/api/jobs/prepare", response: productAgentConflictError },
      { method: "POST", path: "/api/jobs/render", response: productAgentValidationError },
    ]);

    await expect(
      apiClient.createPrepareJob({
        model: "005606",
        url: "https://example.invalid/product",
        photos: 1,
        sections: 1,
        skroutz_status: 1,
        boxnow: 0,
        price: 199.9,
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("already running"),
    } satisfies Partial<ApiError>);

    await expect(apiClient.createRenderJob({ model: "" })).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("Model is required"),
    } satisfies Partial<ApiError>);
  });
});
