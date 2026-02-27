import type { Activity } from "../models";

export const activityService = {
  getActivitiesByProject: async (_projectId: number | string | string): Promise<Activity[]> => {
    // Placeholder returning empty for now
    return [];
  },
};
