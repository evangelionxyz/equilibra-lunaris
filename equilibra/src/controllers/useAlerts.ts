import { useState, useEffect, useCallback } from "react";
import type { Alert } from "../models";
import { alertService } from "../services/alertService";

interface UseAlertsOptions {
  userId?: string | number;
  projectId?: string | number;
}

export const useAlerts = (
  projectIdOrOptions?: string | number | UseAlertsOptions,
) => {
  // Support both legacy useAlerts(projectId) and new useAlerts({ userId, projectId })
  const options: UseAlertsOptions =
    typeof projectIdOrOptions === "object" &&
    projectIdOrOptions !== null &&
    !Array.isArray(projectIdOrOptions)
      ? projectIdOrOptions
      : { projectId: projectIdOrOptions as string | number | undefined };

  const { userId, projectId } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        let data: Alert[];
        if (userId) {
          // Strict data-contract path: only unresolved, user-scoped
          data = await alertService.getAlertsForUser(userId);
        } else {
          // Legacy fallback: fetches all and filters client-side
          data = await alertService.getMyAlerts();
        }

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
    },
    [userId, projectId],
  );

  useEffect(() => {
    fetchAlerts();

    const intervalId = setInterval(() => {
      fetchAlerts(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchAlerts]);

  const resolveAlert = useCallback(async (id: number | string) => {
    await alertService.resolveAlert(id);
    // Remove from list immediately since the new endpoint only returns unresolved
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // When using user-scoped endpoint, all returned alerts are already unresolved.
  // For legacy path, still filter by is_resolved.
  const activeAlerts = userId ? alerts : alerts.filter((a) => !a.is_resolved);

  return { alerts: activeAlerts, loading, error, resolveAlert };
};
