import type { Activity } from "../models";

export const activityService = {
  getActivitiesByProject: async (_projectId: number): Promise<Activity[]> => {
    // Placeholder returning empty for now
    return [];
  },
};
