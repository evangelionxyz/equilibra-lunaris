import type { UserProjectStats } from "../models";

export const statsService = {
  getStatsByProject: async (
    _projectId: number,
    _userId: number,
  ): Promise<UserProjectStats | null> => {
    // Placeholder returning null for now
    return null;
  },
};
