import { apiFetch } from "./apiClient";
import type { Meeting } from "../models";

export const meetingService = {
  getMeetingsByProject: async (projectId: number): Promise<Meeting[]> => {
    return await apiFetch<Meeting[]>(`/meetings/project/${projectId}`);
  },

  createMeeting: async (meetingData: any): Promise<Meeting> => {
    return await apiFetch<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(meetingData),
      headers: { "Content-Type": "application/json" },
    });
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
