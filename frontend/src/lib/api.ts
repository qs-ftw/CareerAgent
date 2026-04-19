import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Role APIs ──────────────────────────────────────────
export const roleApi = {
  list: () => apiClient.get("/roles"),
  get: (id: string) => apiClient.get(`/roles/${id}`),
  create: (data: unknown) => apiClient.post("/roles", data),
  update: (id: string, data: unknown) => apiClient.patch(`/roles/${id}`, data),
  delete: (id: string) => apiClient.delete(`/roles/${id}`),
  init: (id: string) => apiClient.post(`/roles/${id}/init`),
  analyzeJd: (raw_jd: string) => apiClient.post("/roles/analyze-jd", { raw_jd }),
  analyzeName: (role_name: string) => apiClient.post("/roles/analyze-name", { role_name }),
};

// ── Resume APIs ────────────────────────────────────────
export const resumeApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get("/resumes", { params }),
  get: (id: string) => apiClient.get(`/resumes/${id}`),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/resumes/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/resumes/${id}`),
  versions: (id: string) => apiClient.get(`/resumes/${id}/versions`),
  getVersion: (resumeId: string, versionId: string) =>
    apiClient.get(`/resumes/${resumeId}/versions/${versionId}`),
  deleteVersion: (resumeId: string, versionId: string) =>
    apiClient.delete(`/resumes/${resumeId}/versions/${versionId}`),
  applySuggestion: (id: string, suggestionId: string) =>
    apiClient.post(`/resumes/${id}/apply-suggestion`, { suggestion_id: suggestionId }),
  exportPdf: (id: string) =>
    apiClient.post(`/resumes/${id}/export-pdf`, null, { responseType: "blob" }),
};

// ── Achievement APIs ───────────────────────────────────
export const achievementApi = {
  list: () => apiClient.get("/achievements"),
  get: (id: string) => apiClient.get(`/achievements/${id}`),
  create: (data: unknown) => apiClient.post("/achievements", data),
  analyze: (id: string) => apiClient.post(`/achievements/${id}/analyze`),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/achievements/${id}`, data),
  delete: (id: string) => apiClient.delete(`/achievements/${id}`),
  interactiveStart: (id: string) =>
    apiClient.post(`/achievements/${id}/interactive/start`),
  interactiveChat: (id: string, message: string) =>
    apiClient.post(`/achievements/${id}/interactive/chat`, { message }),
  interactiveGenerate: (id: string) =>
    apiClient.post(`/achievements/${id}/interactive/generate`),
};

// ── Gap APIs ───────────────────────────────────────────
export const gapApi = {
  list: (roleId?: string) =>
    apiClient.get("/gaps", { params: { role_id: roleId } }),
  byRole: (roleId: string) => apiClient.get(`/roles/${roleId}/gaps`),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/gaps/${id}`, data),
  delete: (id: string) => apiClient.delete(`/gaps/${id}`),
};

// ── JD APIs ────────────────────────────────────────────
export const jdApi = {
  parse: (data: { raw_jd: string }) => apiClient.post("/jd/parse", data),
  tailor: (data: unknown) => apiClient.post("/jd/tailor", data),
  getTask: (taskId: string) => apiClient.get(`/jd/tasks/${taskId}`),
  exportPdf: (taskId: string) =>
    apiClient.post(`/jd/tasks/${taskId}/export-pdf`, null, { responseType: "blob" }),
};

// ── Suggestion APIs ────────────────────────────────────
export const suggestionApi = {
  list: (filters?: Record<string, string>) =>
    apiClient.get("/suggestions", { params: filters }),
  accept: (id: string) => apiClient.post(`/suggestions/${id}/accept`),
  reject: (id: string) => apiClient.post(`/suggestions/${id}/reject`),
};

// ── Profile APIs ───────────────────────────────────────
export const profileApi = {
  get: () => apiClient.get("/profile"),
  upsert: (data: unknown) => apiClient.put("/profile", data),
  completeness: () => apiClient.get("/profile/completeness"),
  importResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/profile/import-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Work Experience APIs ────────────────────────────────
export const workExperienceApi = {
  list: () => apiClient.get("/work-experiences"),
  create: (data: unknown) => apiClient.post("/work-experiences", data),
  update: (id: string, data: unknown) => apiClient.patch(`/work-experiences/${id}`, data),
  delete: (id: string) => apiClient.delete(`/work-experiences/${id}`),
};

// ── Education APIs ──────────────────────────────────────
export const educationApi = {
  list: () => apiClient.get("/educations"),
  create: (data: unknown) => apiClient.post("/educations", data),
  update: (id: string, data: unknown) => apiClient.patch(`/educations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/educations/${id}`),
};

// ── Project APIs ────────────────────────────────────────
export const projectApi = {
  list: () => apiClient.get("/projects"),
  create: (data: unknown) => apiClient.post("/projects", data),
  update: (id: string, data: unknown) => apiClient.patch(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

// ── Story APIs ─────────────────────────────────────────
export const storyApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get("/stories", { params }),
  get: (id: string, params?: Record<string, string>) =>
    apiClient.get(`/stories/${id}`, { params }),
  create: (data: unknown) =>
    apiClient.post("/stories", data),
  rebuild: (achievementId: string) =>
    apiClient.post(`/stories/rebuild/${achievementId}`),
  update: (id: string, data: unknown) =>
    apiClient.patch(`/stories/${id}`, data),
  consult: (id: string, user_message?: string, resume_id?: string) =>
    apiClient.post(`/stories/${id}/consult`, { user_message, resume_id }),
  autopilot: (id: string, resume_id?: string) =>
    apiClient.post(`/stories/${id}/autopilot`, null, { params: { resume_id } }),
};

// ── Dashboard APIs ─────────────────────────────────────
export const dashboardApi = {
  stats: () => apiClient.get("/dashboard/stats"),
  recentJdDecisions: () => apiClient.get("/dashboard/recent-jd-decisions"),
  roleSummaries: () => apiClient.get("/dashboard/role-summaries"),
  highPriorityGaps: () => apiClient.get("/dashboard/high-priority-gaps"),
};

// ── Coach APIs ────────────────────────────────────────
export const coachApi = {
  latestAssessment: () => apiClient.get("/coach/assessment/latest"),
  listAssessments: () => apiClient.get("/coach/assessments"),
  refreshAssessment: () => apiClient.post("/coach/assessment/refresh"),

  // Context Items
  listContextItems: () =>
    apiClient.get("/coach/context-items"),
  createContextItem: (data: unknown) =>
    apiClient.post("/coach/context-items", data),
  updateContextItem: (id: string, data: unknown) =>
    apiClient.patch(`/coach/context-items/${id}`, data),

  // Tasks
  listTasks: (itemId: string) =>
    apiClient.get(`/coach/context-items/${itemId}/tasks`),
  createTask: (itemId: string, data: unknown) =>
    apiClient.post(`/coach/context-items/${itemId}/tasks`, data),
  updateTask: (taskId: string, data: unknown) =>
    apiClient.patch(`/coach/tasks/${taskId}`, data),

  // Progress Entries
  listProgressEntries: (itemId: string) =>
    apiClient.get(`/coach/context-items/${itemId}/progress`),
  createProgressEntry: (itemId: string, data: unknown) =>
    apiClient.post(`/coach/context-items/${itemId}/progress`, data),
  updateProgressEntry: (entryId: string, data: unknown) =>
    apiClient.patch(`/coach/progress/${entryId}`, data),
};

// ── Knowledge APIs ─────────────────────────────────────
export const knowledgeApi = {
  // Domain endpoints
  listDomains: (resumeId?: string) =>
    apiClient.get("/knowledge/domains", { params: { resume_id: resumeId } }),
  createDomain: (data: unknown) =>
    apiClient.post("/knowledge/domains", data),
  updateDomain: (id: string, data: unknown) =>
    apiClient.patch(`/knowledge/domains/${id}`, data),
  deleteDomain: (id: string) =>
    apiClient.delete(`/knowledge/domains/${id}`),

  // Question endpoints
  listQuestions: (domainId: string) =>
    apiClient.get(`/knowledge/domains/${domainId}/questions`),
  createQuestion: (domainId: string, data: unknown) =>
    apiClient.post(`/knowledge/domains/${domainId}/questions`, data),
  updateQuestion: (id: string, data: unknown) =>
    apiClient.patch(`/knowledge/questions/${id}`, data),
  deleteQuestion: (id: string) =>
    apiClient.delete(`/knowledge/questions/${id}`),

  // Resume linking endpoints
  listResumeDomains: (resumeId: string) =>
    apiClient.get(`/knowledge/resumes/${resumeId}/domains`),
  linkResumeDomains: (resumeId: string, domainIds: string[]) =>
    apiClient.post(`/knowledge/resumes/${resumeId}/domains`, { domain_ids: domainIds }),
};

// ── Personal OKR APIs ───────────────────────────────────
export const okrApi = {
  // Objectives
  listObjectives: () =>
    apiClient.get<import("@/types").PersonalObjective[]>("/okr/objectives"),
  getObjective: (id: string) =>
    apiClient.get<import("@/types").PersonalObjective>(`/okr/objectives/${id}`),
  createObjective: (data: import("@/types").PersonalObjectiveCreate) =>
    apiClient.post<import("@/types").PersonalObjective>("/okr/objectives", data),
  updateObjective: (id: string, data: import("@/types").PersonalObjectiveUpdate) =>
    apiClient.patch<import("@/types").PersonalObjective>(`/okr/objectives/${id}`, data),
  deleteObjective: (id: string) =>
    apiClient.delete(`/okr/objectives/${id}`),

  // Key Results
  createKeyResult: (objectiveId: string, data: import("@/types").PersonalKeyResultCreate) =>
    apiClient.post<import("@/types").PersonalKeyResult>(`/okr/objectives/${objectiveId}/key-results`, data),
  updateKeyResult: (krId: string, data: import("@/types").PersonalKeyResultUpdate) =>
    apiClient.patch<import("@/types").PersonalKeyResult>(`/okr/key-results/${krId}`, data),
  deleteKeyResult: (krId: string) =>
    apiClient.delete(`/okr/key-results/${krId}`),

  // Suggestions
  getWeeklySuggestions: () =>
    apiClient.post<import("@/types").WeeklyActionSuggestionsResponse>("/okr/weekly-suggestions"),
};

// ── Weekly Review APIs ──────────────────────────────────
export const weeklyReviewApi = {
  list: () =>
    apiClient.get<import("@/types").WeeklyReview[]>("/coach/weekly-reviews"),
  get: (id: string) =>
    apiClient.get<import("@/types").WeeklyReview>(`/coach/weekly-reviews/${id}`),
  generate: (data: import("@/types").WeeklyReviewGenerateRequest) =>
    apiClient.post<import("@/types").WeeklyReview>("/coach/weekly-reviews/generate", data),
  update: (id: string, data: import("@/types").WeeklyReviewUpdate) =>
    apiClient.patch<import("@/types").WeeklyReview>(`/coach/weekly-reviews/${id}`, data),
};
