import type { Alert, ExtractedTaskPayload } from "../models";
import { apiFetch } from "./apiClient";

export const alertService = {
  /** Legacy: fetches all alerts (no user filter, includes resolved). */
  getMyAlerts: async (): Promise<Alert[]> => {
    return await apiFetch<Alert[]>("/alerts");
  },

  /**
   * Data-contract compliant: fetches only unresolved alerts for a specific
   * user from GET /users/{userId}/alerts.
   * The response omits is_resolved (backend guarantees unresolved-only).
   */
  getAlertsForUser: async (userId: number | string): Promise<Alert[]> => {
    return await apiFetch<Alert[]>(`/users/${userId}/alerts`);
  },

  resolveAlert: async (id: number | string): Promise<void> => {
    await apiFetch(`/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ is_resolved: true }),
    });
  },

  confirmTasks: async (
    alertId: number | string,
    projectId: number | string,
    tasks: ExtractedTaskPayload[],
  ): Promise<{ status: string; tasks_created: number }> => {
    return await apiFetch("/api/v1/tasks/batch-review", {
      method: "POST",
      body: JSON.stringify({ alert_id: alertId, project_id: projectId, tasks }),
    });
  },
};
