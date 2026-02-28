import { useState, useEffect } from "react";
// Role was removed from models
import { projectMemberService } from "../services/projectMemberService";

export const useCurrentUserRole = (
  projectId: string | number | null,
  userId: number | string | undefined,
) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !userId) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      try {
        const members = await projectMemberService.getMembers(projectId);
        const member = members.find(
          (m: any) => String(m.user_id) === String(userId),
        );
        setRole(member?.role || null);
        console.log("Member role:", member?.role);
      } catch (err) {
        console.error("Failed to fetch role:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [projectId, userId]);

  return { role, loading };
};
