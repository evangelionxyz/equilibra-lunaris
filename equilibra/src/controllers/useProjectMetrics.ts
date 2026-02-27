import { useState, useEffect } from "react";
import type { ProjectMetric } from "../models";
import { metricService } from "../services/metricService";

export const useProjectMetrics = (projectId: number) => {
  const [metrics, setMetrics] = useState<ProjectMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await metricService.getMetricsByProject(projectId);
      if (isMounted) {
        setMetrics(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return { metrics, loading };
};
