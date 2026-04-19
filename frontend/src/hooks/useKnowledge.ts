import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeApi } from "@/lib/api";
import type { 
  KnowledgeDomain, 
  KnowledgeDomainCreateRequest, 
  KnowledgeDomainUpdateRequest,
  KnowledgeQuestion,
  KnowledgeQuestionCreateRequest,
  KnowledgeQuestionUpdateRequest
} from "@/types";

export function useDomains(resumeId?: string) {
  return useQuery<KnowledgeDomain[]>({
    queryKey: ["knowledge", "domains", { resumeId }],
    queryFn: async () => {
      const { data } = await knowledgeApi.listDomains(resumeId);
      return data;
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: KnowledgeDomainCreateRequest) => {
      const res = await knowledgeApi.createDomain(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] });
    },
  });
}

export function useUpdateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeDomainUpdateRequest }) => {
      const res = await knowledgeApi.updateDomain(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] });
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await knowledgeApi.deleteDomain(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] });
    },
  });
}

export function useQuestions(domainId: string) {
  return useQuery<KnowledgeQuestion[]>({
    queryKey: ["knowledge", "domains", domainId, "questions"],
    queryFn: async () => {
      const { data } = await knowledgeApi.listQuestions(domainId);
      return data;
    },
    enabled: !!domainId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ domainId, data }: { domainId: string; data: KnowledgeQuestionCreateRequest }) => {
      const res = await knowledgeApi.createQuestion(domainId, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains", variables.domainId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] }); // To update question_count
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeQuestionUpdateRequest }) => {
      const res = await knowledgeApi.updateQuestion(id, data);
      return res.data;
    },
    onSuccess: (data: KnowledgeQuestion) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains", data.domain_id, "questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; domainId: string }) => {
      await knowledgeApi.deleteQuestion(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains", variables.domainId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] }); // To update question_count
    },
  });
}

export function useResumeDomains(resumeId: string) {
  return useQuery<string[]>({
    queryKey: ["knowledge", "resumes", resumeId, "domains"],
    queryFn: async () => {
      const { data } = await knowledgeApi.listResumeDomains(resumeId);
      return data;
    },
    enabled: !!resumeId,
  });
}

export function useLinkResumeDomains() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ resumeId, domainIds }: { resumeId: string; domainIds: string[] }) => {
      const res = await knowledgeApi.linkResumeDomains(resumeId, domainIds);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "resumes", variables.resumeId, "domains"] });
      // Also invalidate domains list since it might be filtered by resumeId
      queryClient.invalidateQueries({ queryKey: ["knowledge", "domains"] });
    },
  });
}
