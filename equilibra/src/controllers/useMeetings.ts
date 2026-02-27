import { useState, useEffect, useCallback } from "react";
import type { Meeting, MeetingSource } from "../models";
import { meetingService } from "../services/mockService";

export const useMeetings = (projectId: number) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetingsByProject(projectId);
      setMeetings(data);
      setError(null);
    } catch {
      setError("Failed to fetch meetings");
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
      const created = await meetingService.createMeeting(data);
      setMeetings((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const deleteMeeting = useCallback(async (id: number) => {
    await meetingService.deleteMeeting(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { meetings, loading, error, createMeeting, deleteMeeting };
};
