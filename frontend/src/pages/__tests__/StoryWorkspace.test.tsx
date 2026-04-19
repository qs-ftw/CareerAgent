import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StoryWorkspace } from "../StoryWorkspace";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as useStoriesHooks from "@/hooks/useStories";

// Mock hooks
vi.mock("@/hooks/useStories", () => ({
  useStory: vi.fn(),
  useUpdateStory: vi.fn(),
  useConsultStory: vi.fn(),
  useAutopilotStory: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe("StoryWorkspace Frontend Logic Verification", () => {
  const mockStory = {
    id: "test-id",
    question_text: "Test Question",
    answer_markdown: "Old Answer",
    theme: "general",
    status: "empty",
    analysis_chat: [],
  };

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStoriesHooks.useStory as any).mockReturnValue({ data: mockStory, isLoading: false });
    (useStoriesHooks.useUpdateStory as any).mockReturnValue({ mutate: mockMutate, isPending: false });
    (useStoriesHooks.useConsultStory as any).mockReturnValue({ mutate: mockMutate, isPending: false });
    (useStoriesHooks.useAutopilotStory as any).mockReturnValue({ mutate: mockMutate, isPending: false });
  });

  it("should update editor when AI Autopilot is successful", async () => {
    // 模拟 autopilot.mutate 的行为，直接调用 onSuccess
    (useStoriesHooks.useAutopilotStory as any).mockReturnValue({
      mutate: (_: string, options: any) => {
        options.onSuccess({ answer_markdown: "New AI Content" });
      },
      isPending: false,
    });

    render(<StoryWorkspace />, { wrapper });

    const autopilotBtn = screen.getByText(/AI 自动填充/i);
    fireEvent.click(autopilotBtn);

    // 验证左侧文本框内容是否变为 "New AI Content"
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/在这里开始书写你的故事/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe("New AI Content");
    });
  });

  it("should show user message immediately after sending", async () => {
    render(<StoryWorkspace />, { wrapper });

    const input = screen.getByPlaceholderText(/询问建议或引用成果/i);
    const sendBtn = screen.getByRole("button", { name: "" }); // 这里的 name 是空的，因为只有图标

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendBtn);

    // 验证用户发送的消息是否立即出现在聊天框中
    expect(screen.getByText("Hello AI")).toBeDefined();
  });
});
