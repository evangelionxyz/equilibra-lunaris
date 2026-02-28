import type { ProjectMetric } from "../models";

export const metricService = {
  getMetricsByProject: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _projectId: number | string,
  ): Promise<ProjectMetric[]> => {
    // Placeholder returning empty for now
    return [];
  },
};
