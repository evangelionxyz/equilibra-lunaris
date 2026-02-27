import { apiFetch } from "./apiClient";
import type { Meeting, MeetingSource } from "../models";

interface BackendMeeting {
  id: string;
  title: string;
  date?: string;
  time?: string;
}

export const meetingService = {
  getMeetingsByProject: async (projectId: number): Promise<Meeting[]> => {
    // Mocked in API router/meetings.py as returning a list
    const meetings = await apiFetch<BackendMeeting[]>("/meetings");
    return meetings.map((m) => ({
      id: parseInt(m.id.split("-")[1]) || 0, // Converting mock string ID to number
      project_id: projectId,
      source_type: "MANUAL" as MeetingSource,
      title: m.title,
      date: m.date || new Date().toISOString().split("T")[0],
      time: m.time || "10:00",
      attendees: [],
      action_items: [],
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
        // browser-fetch automatically sets content-type for FormData with boundary
        headers: {},
      },
    );
  },
};
