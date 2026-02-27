import type { Activity } from "../models";

export const activityService = {
  getActivitiesByProject: async (_projectId: number | string): Promise<Activity[]> => {
    // Placeholder returning empty for now
    return [];
  },
};
