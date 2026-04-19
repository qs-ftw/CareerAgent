import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { okrApi } from "@/lib/api";
import type {
  PersonalObjective,
  PersonalObjectiveCreate,
  PersonalObjectiveUpdate,
  PersonalKeyResultCreate,
  PersonalKeyResultUpdate,
  WeeklyActionSuggestionsResponse,
} from "@/types";

export function usePersonalOkrs() {
  return useQuery<PersonalObjective[]>({
    queryKey: ["okr", "objectives"],
    queryFn: async () => {
      const { data } = await okrApi.listObjectives();
      return data;
    },
  });
}

export function useCreatePersonalOkr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalObjectiveCreate) => {
      const resp = await okrApi.createObjective(data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useUpdatePersonalOkr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PersonalObjectiveUpdate }) => {
      const resp = await okrApi.updateObjective(id, data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useDeletePersonalOkr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await okrApi.deleteObjective(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useCreateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ objectiveId, data }: { objectiveId: string; data: PersonalKeyResultCreate }) => {
      const resp = await okrApi.createKeyResult(objectiveId, data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ krId, data }: { krId: string; data: PersonalKeyResultUpdate }) => {
      const resp = await okrApi.updateKeyResult(krId, data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (krId: string) => {
      await okrApi.deleteKeyResult(krId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr", "objectives"] });
    },
  });
}

export function useWeeklyActionSuggestions() {
  return useQuery<WeeklyActionSuggestionsResponse | null>({
    queryKey: ["okr", "weekly-suggestions"],
    queryFn: async () => {
      const { data } = await okrApi.getWeeklySuggestions();
      return data;
    },
    enabled: false, // Don't run automatically
    staleTime: Infinity, // Keep the suggestions once loaded
  });
}
