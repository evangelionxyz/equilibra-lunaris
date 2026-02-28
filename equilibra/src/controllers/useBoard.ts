import { useState, useEffect, useCallback } from "react";
import type { Bucket, Task } from "../models";
import { apiFetch } from "../services/apiClient";
import { useToast } from "../design-system/Toast";

interface BoardData {
  buckets: Bucket[];
  tasks: Task[];
}

/**
 * Unified hook that fetches both buckets and tasks in a single request to
 * GET /api/projects/{id}/board — the strict Kanban Data Contract endpoint.
 *
 * The board endpoint only returns the minimal fields needed by the UI
 * (no description, no branch_name, etc.).  Use the existing taskService /
 * bucketService methods for mutation operations (create, update, delete, reorder).
 */
export const useBoard = (projectId: string | number) => {
  const { showToast } = useToast();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      try {
        if (!silent) setLoading(true);
        const data = await apiFetch<BoardData>(`/projects/${projectId}/board`);
        const sortedBuckets = [...(data.buckets ?? [])].sort(
          (a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0),
        );
        const sortedTasks = [...(data.tasks ?? [])].sort(
          (a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0),
        );
        setBuckets(sortedBuckets);
        setTasks(sortedTasks);
        setError(null);
      } catch (err) {
        console.error("useBoard fetch error:", err);
        setError("Failed to load board data");
        if (!silent) showToast("Error loading board", "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId, showToast],
  );

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  /**
   * Optimistically update a task's bucket_id in local state
   * (called after a successful reorder/move API call).
   */
  const moveTaskLocally = useCallback(
    (taskId: number | string, newBucketId: number | string) => {
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === String(taskId)
            ? { ...t, bucket_id: newBucketId }
            : t,
        ),
      );
    },
    [],
  );

  /**
   * Optimistically apply a partial update to a task in local state.
   */
  const updateTaskLocally = useCallback(
    (taskId: number | string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === String(taskId) ? { ...t, ...patch } : t,
        ),
      );
    },
    [],
  );

  return {
    buckets,
    tasks,
    loading,
    error,
    refreshBoard: fetchBoard,
    moveTaskLocally,
    updateTaskLocally,
  };
};
