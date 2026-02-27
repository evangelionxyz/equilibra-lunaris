import { useState, useEffect } from "react";
import type { ProjectMetric } from "../models";
import { metricService } from "../services/mockService";

export const useProjectMetrics = (projectId: number) => {
  const [metrics, setMetrics] = useState<ProjectMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    metricService.getMetricsByProject(projectId).then((data) => {
      if (isMounted) {
        setMetrics(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return { metrics, loading };
};
