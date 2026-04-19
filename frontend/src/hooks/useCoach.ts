import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { coachApi } from "@/lib/api";
import type { CapabilityAssessment } from "@/types";

export function useLatestCoachAssessment() {
  return useQuery<CapabilityAssessment | null>({
    queryKey: ["coach", "latest-assessment"],
    queryFn: async () => {
      const { data } = await coachApi.latestAssessment();
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data as CapabilityAssessment | null;
      if (data?.status === "pending") {
        return 3000; // Poll every 3 seconds if pending
      }
      return false;
    },
  });
}

export function useCoachAssessmentHistory() {
  return useQuery<CapabilityAssessment[]>({
    queryKey: ["coach", "assessment-history"],
    queryFn: async () => {
      const { data } = await coachApi.listAssessments();
      return data;
    },
  });
}

export function useRefreshCoachAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await coachApi.refreshAssessment();
      return data as CapabilityAssessment | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach"] });
    },
    onError: (error) => {
      console.error("Failed to refresh coach assessment:", error);
    },
  });
}
