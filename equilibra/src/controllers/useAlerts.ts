import { useState, useEffect, useCallback } from "react";
import type { Alert } from "../models";
import { alertService } from "../services/alertService";

export const useAlerts = (projectId?: string | number) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await alertService.getMyAlerts();
      const filtered = projectId
        ? data.filter((a) => String(a.project_id) === String(projectId))
        : data;
      setAlerts(filtered);
      setError(null);
    } catch {
      setError("Failed to fetch alerts");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAlerts();

    const intervalId = setInterval(() => {
      fetchAlerts(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchAlerts]);

  const resolveAlert = useCallback(async (id: number | string) => {
    await alertService.resolveAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_resolved: true } : a)),
    );
  }, []);

  const activeAlerts = alerts.filter((a) => !a.is_resolved);

  return { alerts: activeAlerts, loading, error, resolveAlert };
};
