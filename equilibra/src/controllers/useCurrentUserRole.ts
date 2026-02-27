import { useState, useEffect } from "react";
// Role was removed from models
import { userService } from "../services/userService";

export const useCurrentUserRole = (projectId: number | null) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      const t = setTimeout(() => setRole(null), 0);
      return () => clearTimeout(t);
    }

    const fetchRole = async () => {
      setLoading(true);
      // Hardcoding user_id = 1 (Budi) as the "current user" for the mock
      // In a real app, you'd fetch the specific membership.
      // For now, we'll fetch all members and find the one for user 1.
      const members = await userService.getProjectMembers(projectId);
      const member = members.find((m) => m.user_id === 1);
      setRole(member?.role || null);
      setLoading(false);
    };

    fetchRole();
  }, [projectId]);

  return { role, loading };
};
