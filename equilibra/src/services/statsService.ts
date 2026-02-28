import type { UserProjectStats } from "../models";

export const statsService = {
  getStatsByProject: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _projectId: number | string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: number | string,
  ): Promise<UserProjectStats | null> => {
    // Placeholder returning null for now
    return null;
  },
};
