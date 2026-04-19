import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coachApi } from "@/lib/api";
import type { 
  PerformanceContextItem, 
  PerformanceContextItemCreate, 
  PerformanceContextItemUpdate,
  PerformanceTask,
  PerformanceTaskCreate,
  PerformanceTaskUpdate,
  PerformanceProgressEntry,
  PerformanceProgressEntryCreate,
  PerformanceProgressEntryUpdate
} from "@/types";

export function usePerformanceContextItems() {
  return useQuery<PerformanceContextItem[]>({
    queryKey: ["coach", "context-items"],
    queryFn: async () => {
      const { data } = await coachApi.listContextItems();
      return data;
    },
  });
}

export function useCreatePerformanceContextItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PerformanceContextItemCreate) => {
      const resp = await coachApi.createContextItem(data);
      return resp.data as PerformanceContextItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items"] });
    },
  });
}

export function useUpdatePerformanceContextItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PerformanceContextItemUpdate }) => {
      const resp = await coachApi.updateContextItem(id, data);
      return resp.data as PerformanceContextItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items"] });
    },
  });
}

export function usePerformanceTasks(itemId: string) {
  return useQuery<PerformanceTask[]>({
    queryKey: ["coach", "context-items", itemId, "tasks"],
    queryFn: async () => {
      const { data } = await coachApi.listTasks(itemId);
      return data;
    },
    enabled: !!itemId,
  });
}

export function useCreatePerformanceTask(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PerformanceTaskCreate) => {
      const resp = await coachApi.createTask(itemId, data);
      return resp.data as PerformanceTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items", itemId, "tasks"] });
    },
  });
}

export function useUpdatePerformanceTask(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: PerformanceTaskUpdate }) => {
      const resp = await coachApi.updateTask(taskId, data);
      return resp.data as PerformanceTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items", itemId, "tasks"] });
    },
  });
}

export function usePerformanceProgressEntries(itemId: string) {
  return useQuery<PerformanceProgressEntry[]>({
    queryKey: ["coach", "context-items", itemId, "progress"],
    queryFn: async () => {
      const { data } = await coachApi.listProgressEntries(itemId);
      return data;
    },
    enabled: !!itemId,
  });
}

export function useCreatePerformanceProgressEntry(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PerformanceProgressEntryCreate) => {
      const resp = await coachApi.createProgressEntry(itemId, data);
      return resp.data as PerformanceProgressEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items", itemId, "progress"] });
    },
  });
}

export function useUpdatePerformanceProgressEntry(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: PerformanceProgressEntryUpdate }) => {
      const resp = await coachApi.updateProgressEntry(entryId, data);
      return resp.data as PerformanceProgressEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "context-items", itemId, "progress"] });
    },
  });
}
