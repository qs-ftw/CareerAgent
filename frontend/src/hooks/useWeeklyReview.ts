import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weeklyReviewApi } from "@/lib/api";
import type { WeeklyReview, WeeklyReviewGenerateRequest, WeeklyReviewUpdate } from "@/types";

export function useWeeklyReviews() {
  return useQuery<WeeklyReview[]>({
    queryKey: ["weekly-reviews"],
    queryFn: async () => {
      const { data } = await weeklyReviewApi.list();
      return data;
    },
  });
}

export function useWeeklyReview(id: string | null) {
  return useQuery<WeeklyReview | null>({
    queryKey: ["weekly-reviews", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await weeklyReviewApi.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useGenerateWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WeeklyReviewGenerateRequest) => {
      const response = await weeklyReviewApi.generate(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reviews"] });
      // Also invalidate coach assessment as it's refreshed during generation
      queryClient.invalidateQueries({ queryKey: ["coach"] });
    },
  });
}

export function useUpdateWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WeeklyReviewUpdate }) => {
      const response = await weeklyReviewApi.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reviews", data.id] });
      queryClient.invalidateQueries({ queryKey: ["weekly-reviews"] });
    },
  });
}
