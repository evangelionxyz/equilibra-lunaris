import type { Activity } from "../models";
import { apiFetch } from "./apiClient";

export const activityService = {
  getActivitiesByProject: async (projectId: number): Promise<Activity[]> => {
    return await apiFetch<Activity[]>(`/projects/${projectId}/activities`);
  },

  createActivity: async (
    data: Omit<Activity, "id" | "created_at">,
  ): Promise<Activity> => {
    return await apiFetch<Activity>("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
