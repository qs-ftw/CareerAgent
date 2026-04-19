// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PerformanceCoach } from "../PerformanceCoach";

vi.mock("@/hooks/useCoach", () => ({
  useLatestCoachAssessment: () => ({
    data: {
      id: "coach-1",
      profile_id: "profile-1",
      assessment_scope: "full_refresh",
      core_level: "C1",
      core_reasoning_markdown: "稳定交付证据已满足 C1。",
      dimension_levels: {
        execution_delivery: {
          level: "L2",
          status: "proven",
          summary: "连续形成明确结果。",
          evidence_count: 2,
        },
        breakthrough_problem_solving: {
          level: "L1",
          status: "partial",
          summary: "具备问题定位证据。",
          evidence_count: 1,
        },
      },
      evidence_links: [
        {
          source_type: "achievement",
          source_id: "ach-1",
          title: "修复训练链路回归问题",
          summary: "训练成功率提升到 99%",
          dimensions: ["execution_delivery", "breakthrough_problem_solving"],
        },
      ],
      next_level_gaps: ["缺少 owner 级模块闭环证据"],
      suggested_actions: ["把修复经验沉淀成可复用运行手册"],
      created_at: "2026-04-19T00:00:00Z",
      updated_at: "2026-04-19T00:00:00Z",
    },
    isLoading: false,
    isError: false,
  }),
  useRefreshCoachAssessment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("PerformanceCoach route shell", () => {
  it("renders the page title and phase tabs", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/coach"]}>
          <Routes>
            <Route path="/coach" element={<PerformanceCoach />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("绩效教练")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "能力总览" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "工作上下文" })).toBeDisabled();
    expect(screen.getByText("当前被证明达到")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText("修复训练链路回归问题")).toBeInTheDocument();
    expect(screen.getByText("缺少 owner 级模块闭环证据")).toBeInTheDocument();
    expect(screen.getByText("把修复经验沉淀成可复用运行手册")).toBeInTheDocument();
  });
});
