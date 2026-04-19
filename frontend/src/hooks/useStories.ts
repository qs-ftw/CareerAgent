import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storyApi } from "@/lib/api";
import type { InterviewStory } from "@/types";

interface StoriesListResponse {
  items: InterviewStory[];
  total: number;
}

export function useStories(theme?: string, sourceType?: string, resumeId?: string) {
  return useQuery<StoriesListResponse>({
    queryKey: ["stories", theme, sourceType, resumeId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (theme) params.theme = theme;
      if (sourceType) params.source_type = sourceType;
      if (resumeId) params.resume_id = resumeId;
      const { data } = await storyApi.list(params);
      return data;
    },
  });
}

export function useStory(id: string, resumeId?: string) {
  return useQuery<InterviewStory>({
    queryKey: ["stories", id, resumeId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (resumeId) params.resume_id = resumeId;
      const { data } = await storyApi.get(id, params);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { question_text: string; theme?: string }) => {
      const res = await storyApi.create(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useConsultStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, user_message, resumeId }: { id: string; user_message?: string; resumeId?: string }) => {
      const res = await storyApi.consult(id, user_message, resumeId);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories", variables.id, variables.resumeId] });
    },
  });
}

export function useAutopilotStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resumeId }: { id: string; resumeId?: string }) => {
      const res = await storyApi.autopilot(id, resumeId);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories", variables.id, variables.resumeId] });
    },
  });
}

export function useRebuildStories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (achievementId: string) => {
      const res = await storyApi.rebuild(achievementId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await storyApi.update(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
