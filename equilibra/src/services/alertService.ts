import type { Alert } from "../models";

export const alertService = {
  getMyAlerts: async (): Promise<Alert[]> => {
    // Placeholder returning empty for now
    return [];
  },

  resolveAlert: async (_id: number): Promise<void> => {
    // Placeholder
  },
};
