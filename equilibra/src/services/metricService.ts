import type { ProjectMetric } from "../models";

export const metricService = {
  getMetricsByProject: async (_projectId: number | string | string): Promise<ProjectMetric[]> => {
    // Placeholder returning empty for now
    return [];
  },
};
