import type { Alert, ExtractedTaskPayload } from "../models";
import { apiFetch } from "./apiClient";

export const alertService = {
  getMyAlerts: async (): Promise<Alert[]> => {
    return await apiFetch<Alert[]>("/alerts");
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
    return await apiFetch("/tasks/batch-review", {
      method: "POST",
      body: JSON.stringify({ alert_id: alertId, project_id: projectId, tasks }),
    });
  },
};
