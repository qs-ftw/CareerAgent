import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { Target, FileText, BarChart3, Trophy, UserCircle, ChevronRight, AlertCircle } from "lucide-react";
import { useDashboardStats, useRecentJdDecisions, useRoleSummaries, useHighPriorityGaps } from "@/hooks/useDashboard";
import { useProfileCompleteness } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const RECOMMENDATION_MAP: Record<string, { label: string; bg: string; text: string }> = {
  apply_now: { label: "建议投递", bg: "bg-green-50", text: "text-green-700" },
  tune_then_apply: { label: "微调后投递", bg: "bg-blue-50", text: "text-blue-700" },
  fill_gap_first: { label: "补齐差距", bg: "bg-orange-50", text: "text-orange-700" },
  not_recommended: { label: "不建议", bg: "bg-red-50", text: "text-red-700" },
};

export function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: jdDecisions } = useRecentJdDecisions();
  const { data: roleSummaries } = useRoleSummaries();
  const { data: highPriorityGaps } = useHighPriorityGaps();
  const { data: profileCompleteness } = useProfileCompleteness();
  const navigate = useNavigate();

  const statCards = [
    { label: "目标岗位", value: stats?.role_count ?? 0, icon: Target, color: "text-notion-blue", bg: "bg-blue-50", href: "/roles" },
    { label: "活跃简历", value: stats?.resume_count ?? 0, icon: FileText, color: "text-green-600", bg: "bg-green-50", href: "/resumes" },
    { label: "高优 Gap", value: stats?.high_priority_gap_count ?? 0, icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50", href: "/gaps" },
    { label: "最近成果", value: stats?.recent_achievement_count ?? 0, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50", href: "/portfolio" },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <Header title="仪表盘" description="查看职业资产整体状态" />
      <PageContainer className="space-y-10">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-notion-gray-500 font-medium">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-notion-blue border-t-transparent" />
            加载中...
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <section>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    onClick={() => navigate(stat.href)}
                    className="notion-card cursor-pointer p-5 flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-md", stat.bg)}>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-notion-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-notion-gray-500">{stat.label}</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    </div>
                  </div>
                ))}

                {/* Profile completeness — spans 2 columns */}
                <div
                  onClick={() => navigate("/profile")}
                  className="notion-card cursor-pointer p-5 md:col-span-2 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-blue-50">
                        <UserCircle className="h-4 w-4 text-notion-blue" />
                      </div>
                      <span className="text-sm font-semibold text-notion-gray-500">个人画像</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-notion-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {profileCompleteness?.completeness_pct ?? 0}%
                      </p>
                      <span className={cn("text-xs font-bold notion-pill", 
                        (profileCompleteness?.completeness_pct ?? 0) >= 80 ? "bg-green-50 text-green-700" :
                        (profileCompleteness?.completeness_pct ?? 0) >= 40 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                      )}>
                        {(profileCompleteness?.completeness_pct ?? 0) >= 80 ? "基本完善" : "亟需补充"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-notion-warm-white overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", 
                          (profileCompleteness?.completeness_pct ?? 0) >= 80 ? "bg-green-500" :
                          (profileCompleteness?.completeness_pct ?? 0) >= 40 ? "bg-orange-500" : "bg-red-500"
                        )}
                        style={{ width: `${profileCompleteness?.completeness_pct ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-notion-gray-500 font-medium">
                      {(profileCompleteness?.missing_high_value?.length ?? 0) > 0
                        ? <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            待补充: {profileCompleteness!.missing_high_value.slice(0, 2).join("、")}
                          </span>
                        : <span className="text-green-600 font-bold">核心信息已完善</span>}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Section: Two Columns */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left Column: Role Overview & Recent Decisions */}
              <div className="space-y-10">
                {/* Role Summaries */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold tracking-tight-card">岗位概览</h3>
                    <button onClick={() => navigate("/roles")} className="text-sm font-semibold text-notion-blue hover:underline">
                      查看全部
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {roleSummaries?.slice(0, 4).map((rs) => (
                      <div
                        key={rs.id}
                        onClick={() => navigate(`/roles/${rs.id}`)}
                        className="notion-card cursor-pointer p-4 group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm tracking-tight text-foreground group-hover:text-notion-blue transition-colors">
                            {rs.role_name}
                          </h4>
                          <span className={cn("notion-pill", 
                            rs.status === "active" ? "bg-green-50 text-green-700" : "bg-notion-warm-white text-notion-gray-500"
                          )}>
                            {rs.status === "active" ? "活跃" : "暂停"}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-notion-gray-300">能力匹配</span>
                            <span className="text-base font-bold text-foreground">{Math.round(rs.match_score)}%</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-notion-gray-300">Gap 数量</span>
                            <span className="text-base font-bold text-foreground">{rs.gap_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recent JD Decisions */}
                <section className="notion-card p-6">
                  <h3 className="text-xl font-bold tracking-tight-card mb-4">最近 JD 决策</h3>
                  {jdDecisions && jdDecisions.length > 0 ? (
                    <div className="space-y-1">
                      {jdDecisions.map((decision) => (
                        <div 
                          key={decision.task_id} 
                          className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-notion-warm-white px-2 -mx-2 rounded-md transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn("notion-pill", RECOMMENDATION_MAP[decision.recommendation]?.bg, RECOMMENDATION_MAP[decision.recommendation]?.text)}>
                              {RECOMMENDATION_MAP[decision.recommendation]?.label || decision.recommendation}
                            </span>
                            <span className="text-sm font-bold text-foreground">JD 定制分析</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-notion-gray-500">
                            <span>匹配 {Math.round(decision.ability_match_score * 100)}%</span>
                            <span>{decision.created_at ? new Date(decision.created_at).toLocaleDateString("zh-CN") : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-notion-warm-white rounded-lg border border-dashed border-border">
                      <p className="text-sm font-medium text-notion-gray-500">
                        暂无 JD 决策。尝试使用 JD 定制功能开启你的第一次匹配。
                      </p>
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: High Priority Gaps */}
              <section className="notion-card p-6 h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tight-card">高优先级 Gap</h3>
                  <button onClick={() => navigate("/gaps")} className="text-sm font-semibold text-notion-blue hover:underline">
                    管理 Gap
                  </button>
                </div>
                {highPriorityGaps && highPriorityGaps.length > 0 ? (
                  <div className="space-y-4">
                    {highPriorityGaps.map((gap) => (
                      <div 
                        key={gap.id} 
                        className="p-4 rounded-lg bg-notion-warm-white border border-border group hover:border-notion-blue transition-colors cursor-pointer"
                        onClick={() => navigate("/gaps")}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                              P{gap.priority}
                            </span>
                            <span className="text-sm font-bold text-foreground">{gap.skill_name}</span>
                          </div>
                          <span className={cn("notion-pill", gap.status === "open" ? "bg-white text-notion-gray-500" : "bg-blue-50 text-notion-blue")}>
                            {gap.status === "open" ? "未开始" : "补齐中"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex-1 h-2 rounded-full bg-white overflow-hidden border border-border">
                            <div 
                              className="h-full bg-notion-blue rounded-full transition-all duration-500" 
                              style={{ width: `${gap.progress}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-foreground w-8">{Math.round(gap.progress)}%</span>
                        </div>
                        <p className="mt-2 text-xs text-notion-gray-500 font-medium line-clamp-1">
                          关联于: {gap.gap_type}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-notion-warm-white rounded-lg border border-dashed border-border">
                    <p className="text-sm font-medium text-notion-gray-500">
                      太棒了！目前没有待处理的高优 Gap。
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
