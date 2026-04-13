import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { Target, FileText, BarChart3, Trophy, Bell, BookOpen } from "lucide-react";
import { useDashboardStats, useRecentJdDecisions, useRoleSummaries, useHighPriorityGaps } from "@/hooks/useDashboard";

const RECOMMENDATION_MAP: Record<string, { label: string; color: string }> = {
  apply_now: { label: "建议投递", color: "text-green-600" },
  tune_then_apply: { label: "微调后投递", color: "text-blue-600" },
  fill_gap_first: { label: "补齐差距", color: "text-yellow-600" },
  not_recommended: { label: "不建议", color: "text-red-600" },
};

export function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: jdDecisions } = useRecentJdDecisions();
  const { data: roleSummaries } = useRoleSummaries();
  const { data: highPriorityGaps } = useHighPriorityGaps();
  const navigate = useNavigate();

  const statCards = [
    { label: "目标岗位", value: stats?.role_count ?? 0, icon: Target, color: "text-blue-500" },
    { label: "活跃简历", value: stats?.resume_count ?? 0, icon: FileText, color: "text-green-500" },
    { label: "高优 Gap", value: stats?.high_priority_gap_count ?? 0, icon: BarChart3, color: "text-orange-500" },
    { label: "最近成果", value: stats?.recent_achievement_count ?? 0, icon: Trophy, color: "text-purple-500" },
    { label: "待确认建议", value: stats?.pending_suggestion_count ?? 0, icon: Bell, color: "text-red-500" },
    { label: "面试故事", value: stats?.story_count ?? 0, icon: BookOpen, color: "text-teal-500" },
  ];

  return (
    <>
      <Header title="仪表盘" description="查看职业资产整体状态" />
      <PageContainer>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Role Cards */}
            {roleSummaries && roleSummaries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold">岗位概览</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {roleSummaries.map((rs) => (
                    <div
                      key={rs.id}
                      onClick={() => navigate(`/roles/${rs.id}`)}
                      className="cursor-pointer rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{rs.role_name}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          rs.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {rs.status === "active" ? "进行中" : "已暂停"}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block text-muted-foreground">完成度</span>
                          <span className="font-medium text-foreground">{Math.round(rs.completeness_score)}%</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">匹配度</span>
                          <span className="font-medium text-foreground">{Math.round(rs.match_score)}%</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Gap数</span>
                          <span className="font-medium text-foreground">{rs.gap_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent JD Decisions */}
            <div className="mt-6 rounded-lg border bg-card p-6">
              <h3 className="font-semibold">最近 JD 决策</h3>
              {jdDecisions && jdDecisions.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {jdDecisions.map((decision) => (
                    <div key={decision.task_id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${RECOMMENDATION_MAP[decision.recommendation]?.color || ""}`}>
                          {RECOMMENDATION_MAP[decision.recommendation]?.label || decision.recommendation}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>能力匹配: {Math.round(decision.ability_match_score * 100)}%</span>
                        <span>简历匹配: {Math.round(decision.resume_match_score * 100)}%</span>
                        <span>{decision.created_at ? new Date(decision.created_at).toLocaleDateString("zh-CN") : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  暂无 JD 决策。使用 JD 定制功能后，决策会显示在这里。
                </p>
              )}
            </div>

            {/* High Priority Gaps */}
            {highPriorityGaps && highPriorityGaps.length > 0 && (
              <div className="mt-4 rounded-lg border bg-card p-6">
                <h3 className="font-semibold">高优先级 Gap</h3>
                <div className="mt-3 space-y-2">
                  {highPriorityGaps.map((gap) => (
                    <div key={gap.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                          P{gap.priority}
                        </span>
                        <span className="text-sm">{gap.skill_name}</span>
                        <span className="text-xs text-muted-foreground">{gap.gap_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          gap.status === "open" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          {gap.status === "open" ? "未开始" : "进行中"}
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${gap.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="mt-4 rounded-lg border bg-card p-6">
              <h3 className="font-semibold">快速开始</h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <a href="/roles" className="rounded-lg border p-4 text-sm hover:bg-accent transition-colors">
                  <p className="font-medium">添加岗位目标</p>
                  <p className="mt-1 text-muted-foreground">定义你想要的岗位方向</p>
                </a>
                <a href="/achievements" className="rounded-lg border p-4 text-sm hover:bg-accent transition-colors">
                  <p className="font-medium">录入成果</p>
                  <p className="mt-1 text-muted-foreground">记录项目成果和里程碑</p>
                </a>
                <a href="/jd-tailor" className="rounded-lg border p-4 text-sm hover:bg-accent transition-colors">
                  <p className="font-medium">JD 定制</p>
                  <p className="mt-1 text-muted-foreground">针对真实JD生成定制简历</p>
                </a>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
