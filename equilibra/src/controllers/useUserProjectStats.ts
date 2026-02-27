import { useState, useEffect } from "react";
import type { UserProjectStats } from "../models";
import { statService } from "../services/mockService";

export const useUserProjectStats = (projectId: number, userId: number = 1) => {
  const [stats, setStats] = useState<UserProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await statService.getUserStatsByProject(userId, projectId);
      if (isMounted) {
        setStats(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [projectId, userId]);

  return { stats, loading };
};
