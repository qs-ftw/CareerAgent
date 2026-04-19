import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStories, useCreateStory } from "@/hooks/useStories";
import { useListResumes } from "@/hooks/useResumes";
import { 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Loader2, 
  X, 
  ChevronRight,
  Filter,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_MAP: Record<string, { label: string, color: string, bg: string }> = {
  general: { label: "通用", color: "text-blue-600", bg: "bg-blue-50" },
  leadership: { label: "领导力", color: "text-purple-600", bg: "bg-purple-50" },
  technical: { label: "技术能力", color: "text-emerald-600", bg: "bg-emerald-50" },
  problem_solving: { label: "问题解决", color: "text-orange-600", bg: "bg-orange-50" },
  collaboration: { label: "协作", color: "text-rose-600", bg: "bg-rose-50" },
  behavioral: { label: "行为面试", color: "text-amber-600", bg: "bg-amber-50" }, // 兼容旧数据
};

const THEMES = [
  { label: "全部", value: undefined },
  { label: "通用", value: "general" },
  { label: "领导力", value: "leadership" },
  { label: "技术能力", value: "technical" },
  { label: "问题解决", value: "problem_solving" },
  { label: "协作", value: "collaboration" },
];

export function StoryBank() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  
  const { data: resumes } = useListResumes();
  const { data, isLoading } = useStories(theme, undefined, selectedResumeId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stories = data?.items ?? [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-8 border-b border-border bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-notion-blue">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Repository</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tightest">面试故事库</h1>
          <p className="text-sm font-medium text-notion-gray-500">将你的职业成就转化为动人的面试回答</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="notion-button-primary flex items-center gap-2 shadow-notion-card"
        >
          <Plus className="h-4 w-4" />
          新增面试问题
        </button>
      </div>

      <div className="px-8 py-6 space-y-8 flex-1 overflow-auto bg-notion-warm-white/20">
        {/* Filters */}
        <div className="flex flex-col gap-6 p-6 bg-white rounded-2xl border border-border/50 shadow-notion-card">
          <div className="flex items-center gap-12">
            <div className="space-y-2 min-w-[200px]">
              <div className="flex items-center gap-2 text-notion-gray-300">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">简历上下文视图</span>
              </div>
              <select 
                value={selectedResumeId || ""} 
                onChange={(e) => setSelectedResumeId(e.target.value || undefined)}
                className="w-full bg-notion-warm-white/30 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-notion-blue/20 outline-none appearance-none cursor-pointer"
              >
                <option value="">全部简历 (全局草稿)</option>
                {resumes?.map(r => (
                  <option key={r.id} value={r.id}>{r.resume_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-notion-gray-300">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">分类筛选</span>
              </div>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider",
                      theme === t.value
                        ? "bg-notion-warm-white text-notion-blue"
                        : "text-notion-gray-300 hover:text-foreground hover:bg-notion-warm-white/50"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-xl border border-border bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 notion-card border-dashed bg-white/50">
            <div className="p-4 bg-notion-warm-white rounded-full mb-4">
              <BookOpen className="h-10 w-10 text-notion-gray-300" />
            </div>
            <p className="text-lg font-bold text-notion-gray-500">暂无匹配的问题</p>
            <p className="text-sm font-medium text-notion-gray-300 mt-1">开始添加一个新问题，或者调整筛选条件</p>
            {(theme || selectedResumeId) && (
              <button 
                onClick={() => { setTheme(undefined); setSelectedResumeId(undefined); }} 
                className="mt-6 text-notion-blue font-bold text-sm hover:underline"
              >
                清除所有筛选
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {stories.map((story) => (
              <Link
                key={story.id}
                to={`/stories/${story.id}${selectedResumeId ? `?resumeId=${selectedResumeId}` : ""}`}
                className="notion-card group p-6 flex flex-col hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className={cn(
                    "notion-pill",
                    THEME_MAP[story.theme]?.bg || "bg-notion-warm-white",
                    THEME_MAP[story.theme]?.color || "text-notion-gray-500"
                  )}>
                    {THEME_MAP[story.theme]?.label || story.theme}
                  </span>
                  <StatusBadge status={story.status} />
                </div>

                <h3 className="text-xl font-bold text-foreground leading-tight tracking-tight mb-6 line-clamp-3 group-hover:text-notion-blue transition-colors">
                  {story.question_text}
                </h3>

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-notion-gray-300 uppercase tracking-widest">完善进度</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-notion-warm-white rounded-full overflow-hidden border border-border/50">
                        <div 
                          className="h-full bg-notion-blue transition-all duration-500" 
                          style={{ width: `${story.confidence_score * 100}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-notion-blue">
                        {Math.round(story.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateStoryModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(id) => {
            setIsModalOpen(false);
            navigate(`/stories/${id}`);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "finalized":
      return (
        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
          <CheckCircle2 className="h-3 w-3" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">已定稿</span>
        </div>
      );
    case "drafting":
    case "draft":
      return (
        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
          <Clock className="h-3 w-3" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">打磨中</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-notion-gray-300 bg-notion-warm-white px-2 py-0.5 rounded-full border border-border">
          <Circle className="h-3 w-3" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">未开始</span>
        </div>
      );
  }
}

function CreateStoryModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (id: string) => void }) {
  const [question, setQuestion] = useState("");
  const [theme, setTheme] = useState("general");
  const createStory = useCreateStory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    createStory.mutate(
      { question_text: question.trim(), theme },
      {
        onSuccess: (newStory) => {
          onSuccess(newStory.id);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5backdrop-blur-sm">
      <div className="w-full max-w-xl notion-card p-8 shadow-notion-deep animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight-sub">新增面试故事</h2>
            <p className="text-sm font-medium text-notion-gray-500">输入面试官可能会问的问题</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-notion-warm-white rounded-full text-notion-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest">问题内容</label>
            <textarea
              autoFocus
              className="w-full h-32 p-4 rounded-xl border border-border bg-notion-warm-white/30 text-lg font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all resize-none placeholder:text-notion-gray-300"
              placeholder="例如：请描述一次你与同事发生冲突的经历及解决方法。"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest">所属分类</label>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.filter(t => t.value).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value!)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-lg border transition-all uppercase tracking-wider",
                    theme === t.value
                      ? "bg-notion-blue text-white border-notion-blue shadow-notion-card"
                      : "bg-white text-notion-gray-300 border-border hover:border-notion-blue/30 hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="notion-button-secondary py-2 px-6"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!question.trim() || createStory.isPending}
              className="notion-button-primary py-2 px-8 flex items-center gap-2 disabled:opacity-50 shadow-notion-card"
            >
              {createStory.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              开始打磨故事
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
