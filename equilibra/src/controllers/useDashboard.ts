import { useState, useEffect, useCallback } from "react";
import type { ProjectMember, ProjectMetric, Activity } from "../models";
import { apiFetch } from "../services/apiClient";

interface DashboardData {
  members: ProjectMember[];
  metrics: ProjectMetric[];
  activity: Activity[];
}

/**
 * Unified hook that fetches all Command Center Dashboard data in a single
 * request to GET /api/projects/{id}/dashboard — the strict Dashboard
 * Data Contract endpoint.
 *
 * The dashboard endpoint joins users → project_member to return the
 * correct alias and KPI fields, and returns only the last 20 activity
 * entries.  It never returns sensitive user fields.
 */
export const useDashboard = (projectId: string | number) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetric[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await apiFetch<DashboardData>(
        `/projects/${projectId}/dashboard`,
      );
      setMembers(data.members ?? []);
      setMetrics(data.metrics ?? []);
      setActivity(data.activity ?? []);
      setError(null);
    } catch (err) {
      console.error("useDashboard fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    members,
    metrics,
    activity,
    loading,
    error,
    refreshDashboard: fetchDashboard,
  };
};
