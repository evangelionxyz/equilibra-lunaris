import { apiFetch } from "./apiClient";
import type { Meeting } from "../models";

export const meetingService = {
  getMeetingsByProject: async (projectId: number | string | string): Promise<Meeting[]> => {
    const meetings = await apiFetch<Meeting[]>("/meetings");
    // Ensure all meetings belong to the project in this simple implementation
    return meetings.map((m) => ({
      ...m,
      project_id: projectId,
    }));
  },

  analyzeMeeting: async (
    file: File,
  ): Promise<{ status: string; analysis?: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return await apiFetch<{ status: string; analysis?: string }>(
      "/analyze-meeting",
      {
        method: "POST",
        body: formData,
        headers: {},
      },
    );
  },
};
