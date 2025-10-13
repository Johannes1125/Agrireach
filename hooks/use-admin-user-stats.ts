import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-client";

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingReviewUsers: number;
  generated_at: string;
}

export function useAdminUserStats() {
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching admin user stats...");
        const res = await authFetch("/api/admin/user-stats");
        
        console.log("Response status:", res.status);
        console.log("Response ok:", res.ok);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          throw new Error("Failed to fetch user statistics");
        }
        
        const data: AdminUserStats = await res.json();
        console.log("Raw API response:", data);
        // Handle response format like other admin APIs
        const statsData = data?.data || data;
        console.log("Processed stats data:", statsData);
        setStats(statsData);
      } catch (err: any) {
        console.error("Error fetching admin user stats:", err);
        setError(err.message || "Failed to fetch user statistics");
        // Fallback to default values
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          bannedUsers: 0,
          pendingReviewUsers: 0,
          generated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  return { stats, loading, error };
}
