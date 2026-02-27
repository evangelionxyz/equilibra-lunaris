import { useState, useEffect, useCallback } from "react";
import type { Meeting, MeetingSource } from "../models";
import { meetingService } from "../services/meetingService";
import { useToast } from "../design-system/Toast";

export const useMeetings = (projectId: number | string | string) => {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetingsByProject(projectId);
      setMeetings(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch meetings");
      showToast("Error loading meetings", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createMeeting = useCallback(
    async (data: {
      project_id: number;
      title: string;
      date: string;
      time: string;
      duration?: string;
      source_type?: MeetingSource;
      mom_summary?: string;
      key_decisions?: string[];
      action_items?: any[];
    }) => {
      try {
        // Currently createMeeting in service is just for local mapping
        // in this integration phase, but standardizing the flow.
        const created: Meeting = {
          id: Math.random(),
          project_id: data.project_id,
          title: data.title,
          date: data.date,
          time: data.time,
          source_type: "MANUAL",
          attendees: [],
          action_items: [],
        };
        setMeetings((prev) => [created, ...prev]);
        showToast("Meeting scheduled", "success");
        return created;
      } catch (err) {
        console.error(err);
        showToast("Failed to schedule meeting", "error");
        throw err;
      }
    },
    [],
  );

  const deleteMeeting = useCallback(
    async (id: number) => {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      showToast("Meeting removed", "info");
    },
    [showToast],
  );

  return { meetings, loading, error, createMeeting, deleteMeeting };
};
