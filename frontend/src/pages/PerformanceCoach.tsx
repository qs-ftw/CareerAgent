import { useState } from "react";

import { CoachOverview } from "@/components/coach/CoachOverview";
import { CoachContextTab } from "@/components/coach/CoachContextTab";
import { PersonalOkrTab } from "@/components/coach/PersonalOkrTab";
import { WeeklyReviewTab } from "@/components/coach/WeeklyReviewTab";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLatestCoachAssessment, useRefreshCoachAssessment } from "@/hooks/useCoach";

const TABS = [
  { key: "overview", label: "能力总览", disabled: false },
  { key: "context", label: "工作上下文", disabled: false },
  { key: "okr", label: "个人 OKR", disabled: false },
  { key: "weekly", label: "周报复盘", disabled: false },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PerformanceCoach() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { data, isLoading, isError } = useLatestCoachAssessment();
  const refreshAssessment = useRefreshCoachAssessment();

  const isPending = refreshAssessment.isPending || data?.status === "pending";

  return (
    <>
      <Header
        title="绩效教练"
        description="基于五维模型评估你当前已经被证明达到的能力层级。"
        actions={
          <button
            className="rounded-md bg-notion-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => refreshAssessment.mutate()}
            disabled={isPending}
          >
            {isPending ? "评估中..." : "重新评估"}
          </button>
        }
      />
      <PageContainer className="space-y-6">
        {refreshAssessment.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
            <span>评估刷新失败，请检查配置（如 LLM API Key）后重试。</span>
            <button 
              onClick={() => refreshAssessment.reset()}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              忽略
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 border-b pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-notion-bg-secondary text-foreground"
                  : "text-notion-gray-500 hover:bg-notion-bg-secondary hover:text-foreground"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {isLoading && (
              <div className="rounded-lg border bg-white p-8">正在加载能力评估...</div>
            )}
            {isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8">
                能力评估加载失败。
              </div>
            )}
            {!isLoading && !isError && !data && (
              <div className="rounded-lg border bg-white p-8">
                当前还没有能力评估快照。
              </div>
            )}
            {!isLoading && !isError && data && <CoachOverview assessment={data} />}
          </>
        )}

        {activeTab === "context" && (
          <CoachContextTab />
        )}

        {activeTab === "okr" && (
          <PersonalOkrTab />
        )}

        {activeTab === "weekly" && (
          <WeeklyReviewTab />
        )}
      </PageContainer>
    </>
  );
}
