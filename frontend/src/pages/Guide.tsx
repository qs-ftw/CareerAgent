import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Briefcase,
  Target,
  Trophy,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { useProfileCompleteness } from "@/hooks/useProfile";
import { useWorkExperiences } from "@/hooks/useWorkExperiences";
import { useProjects } from "@/hooks/useProjects";
import { useAchievements } from "@/hooks/useAchievements";
import { useRoles } from "@/hooks/useRoles";
import { useListResumes } from "@/hooks/useResumes";
import { cn } from "@/lib/utils";

interface StepStatus {
  done: boolean;
  detail: string;
}

function useStepStatuses(): StepStatus[] {
  const { data: completeness } = useProfileCompleteness();
  const { data: workExperiences = [] } = useWorkExperiences();
  const { data: projects = [] } = useProjects();
  const { data: achievements = [] } = useAchievements();
  const { data: rolesResp } = useRoles();
  const { data: resumes = [] } = useListResumes();

  const roles = rolesResp?.items ?? [];

  return [
    {
      done: (completeness?.completeness_pct ?? 0) >= 60,
      detail: (completeness?.completeness_pct ?? 0) > 0
        ? `完善度 ${completeness!.completeness_pct}%`
        : "尚未开始",
    },
    {
      done: workExperiences.length > 0 || projects.length > 0,
      detail: `${workExperiences.length} 段经历 · ${projects.length} 个项目`,
    },
    {
      done: roles.length > 0,
      detail: roles.length > 0 ? `${roles.length} 个目标岗位` : "尚未添加",
    },
    {
      done: achievements.length > 0,
      detail: achievements.length > 0 ? `${achievements.length} 条成果` : "尚未录入",
    },
    {
      done: roles.length > 0,
      detail: roles.length > 0 ? `${roles.length} 个岗位可查看` : "先添加目标岗位",
    },
    {
      done: resumes.length > 0,
      detail: resumes.length > 0 ? `${resumes.length} 份简历` : "尚未生成",
    },
  ];
}

const steps = [
  {
    icon: UserCircle,
    title: "完善个人画像",
    desc: "上传简历 PDF 自动提取个人信息，或手动填写姓名、联系方式、专业技能等基础资料。",
    tip: "导入简历一键搞定，省去手动填写",
    tipIcon: Upload,
    href: "/profile",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Briefcase,
    title: "构建职业履历",
    desc: "添加工作经历、教育背景和项目。每段经历下可关联多个项目，每个项目可录入具体成果。",
    tip: "支持在教育/工作经历下管理项目",
    tipIcon: Sparkles,
    href: "/portfolio",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Target,
    title: "设定目标岗位",
    desc: "创建你想投递的岗位方向（如后端工程师、AI 工程师）。系统会为每个岗位建立独立的能力模型。",
    tip: "可粘贴 JD 快速创建",
    tipIcon: Sparkles,
    href: "/roles",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Trophy,
    title: "录入工作成果",
    desc: "将项目中的关键产出整理为成果记录。每条成果会自动分析并匹配到相关岗位。",
    tip: "在 Claude Code 中运行 /check-work 一键从代码生成成果",
    tipIcon: Sparkles,
    href: "/portfolio",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart3,
    title: "查看 Gap 分析",
    desc: "系统对比你的职业资产和目标岗位要求，生成结构化的能力差距报告，明确提升方向。",
    tip: "新增成果后 Gap 会自动更新",
    tipIcon: Sparkles,
    href: "/gaps",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: FileText,
    title: "定制简历",
    desc: "在目标岗位卡片上点击「定制简历」，系统自动匹配你最相关的经历和成果，生成投递就绪的简历版本。",
    tip: "生成后自动跳转到简历详情页",
    tipIcon: Sparkles,
    href: "/roles",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

export function Guide() {
  const navigate = useNavigate();
  const statuses = useStepStatuses();
  const totalDone = statuses.filter((s) => s.done).length;
  const progressPct = Math.round((totalDone / steps.length) * 100);

  return (
    <div className="flex flex-col h-full bg-white">
      <Header 
        title="新手指南" 
        description="六步完成从信息录入到简历生成的完整流程"
      />
      <PageContainer className="max-w-4xl">
        {/* Progress summary */}
        <div className="notion-card p-6 bg-notion-warm-white mb-10 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">配置进度</h3>
            <p className="text-xs text-notion-gray-500 font-medium">
              完成全部步骤以解锁 CareerAgent 的完整能力
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight">{totalDone}/{steps.length}</span>
            </div>
            <div className="h-2 w-32 rounded-full bg-white overflow-hidden border border-border">
              <div
                className="h-full bg-notion-blue rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="relative space-y-8">
          {/* Vertical path */}
          <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-notion-warm-white hidden sm:block" />

          {steps.map((step, i) => {
            const status = statuses[i];
            const Icon = step.icon;
            const TipIcon = step.tipIcon;

            return (
              <div
                key={i}
                className="relative flex flex-col sm:flex-row gap-6 group"
              >
                {/* Step indicator */}
                <div className={cn(
                  "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  status.done
                    ? "border-notion-blue bg-notion-blue text-white shadow-notion-card"
                    : "border-border bg-white text-notion-gray-300"
                )}>
                  {status.done ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-bold tracking-tight">{i + 1}</span>
                  )}
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "notion-card flex-1 p-6 transition-all hover:-translate-y-0.5 cursor-pointer",
                    status.done ? "opacity-75 grayscale-[0.5] hover:grayscale-0" : "hover:border-notion-blue/30"
                  )}
                  onClick={() => navigate(step.href)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-md", step.bg)}>
                        <Icon className={cn("h-5 w-5", step.color)} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg tracking-tight-card group-hover:text-notion-blue transition-colors">
                          {step.title}
                        </h3>
                        <p className={cn("text-xs font-bold notion-pill", 
                          status.done ? "bg-green-50 text-green-700" : "bg-notion-warm-white text-notion-gray-500"
                        )}>
                          {status.detail}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                  </div>

                  <p className="text-sm font-medium text-notion-gray-500 leading-relaxed mb-4">
                    {step.desc}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <div className="notion-pill bg-notion-badge-bg text-notion-badge-text border border-notion-blue/5 flex items-center gap-1.5">
                      <TipIcon className="h-3 w-3" />
                      {step.tip}
                    </div>
                    <div className="text-xs font-bold text-notion-blue opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      立即开始 <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}
