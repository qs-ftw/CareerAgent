import { useState, useEffect, useRef } from "react";
import {
  usePerformanceContextItems,
  useCreatePerformanceContextItem,
  useUpdatePerformanceContextItem,
  usePerformanceTasks,
  useCreatePerformanceTask,
  useUpdatePerformanceTask,
  usePerformanceProgressEntries,
  useCreatePerformanceProgressEntry,
  useUpdatePerformanceProgressEntry
} from "@/hooks/useCoachContext";
import { useProjects } from "@/hooks/useProjects";
import { ProjectPickerModal } from "./ProjectPickerModal";
import type { Project, PerformanceTask, PerformanceProgressEntry } from "@/types";
import {
  Loader2, Plus, X, CheckCircle2, Circle, Clock,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

/* ─── Inline Editable Field ──────────────────────────── */
function EditableText({
  value,
  onSave,
  placeholder,
  className,
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
    }
  }, [editing]);

  if (editing) {
    const shared = "w-full bg-transparent outline-none text-foreground placeholder:text-notion-gray-300 border-b border-notion-blue/40 pb-0.5 transition-colors";
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onSave(draft); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          placeholder={placeholder}
          rows={3}
          className={cn(shared, className)}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        placeholder={placeholder}
        className={cn(shared, className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text rounded px-1 -mx-1 transition-colors hover:bg-notion-bg-secondary",
        !value && "text-notion-gray-300 italic",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
}

/* ─── Task Item ──────────────────────────────────────── */
function TaskItem({
  task,
  onUpdate,
}: {
  task: PerformanceTask;
  onUpdate: (id: string, data: { status?: string; title?: string }) => void;
}) {
  const nextStatus = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";

  return (
    <div className="group flex items-center gap-2.5 py-2">
      <button
        onClick={() => onUpdate(task.id, { status: nextStatus })}
        className="shrink-0 transition-transform hover:scale-110"
      >
        {task.status === "done"
          ? <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
          : task.status === "in_progress"
            ? <Clock className="h-[18px] w-[18px] text-amber-400" />
            : <Circle className="h-[18px] w-[18px] text-notion-gray-300 hover:text-notion-gray-500" />}
      </button>
      <EditableText
        value={task.title}
        onSave={(v) => onUpdate(task.id, { title: v })}
        placeholder="任务名称"
        className={cn(
          "text-[13px] font-medium flex-1",
          task.status === "done" && "line-through text-notion-gray-300"
        )}
      />
    </div>
  );
}

/* ─── Progress Entry Card ────────────────────────────── */
function ProgressCard({
  entry,
  onUpdateStatus,
}: {
  entry: PerformanceProgressEntry;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    logged: { label: "已记录", color: "bg-slate-100 text-slate-600", dotColor: "bg-slate-400" },
    candidate_evidence: { label: "待转证据", color: "bg-amber-50 text-amber-700", dotColor: "bg-amber-400" },
    accepted_evidence: { label: "已采纳", color: "bg-emerald-50 text-emerald-700", dotColor: "bg-emerald-400" },
    discarded: { label: "已忽略", color: "bg-gray-100 text-gray-500", dotColor: "bg-gray-400" },
  };
  const cfg = statusConfig[entry.status] || statusConfig.logged;

  return (
    <div className="group relative">
      {/* Timeline dot */}
      <div className="absolute left-[5px] top-[14px] h-2 w-2 rounded-full ring-2 ring-white">
        <div className={cn("h-full w-full rounded-full", cfg.dotColor)} />
      </div>

      <div className="ml-5 rounded-xl border border-transparent bg-gradient-to-b from-white to-slate-50/50 p-4 pl-5 transition-all group-hover:border-slate-200 group-hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-semibold text-foreground">{entry.title}</h4>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.color)}>
                {cfg.label}
              </span>
            </div>
            <span className="block text-[11px] text-notion-gray-300">
              {entry.occurred_at ? new Date(entry.occurred_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }) : "近期"}
            </span>
          </div>

          {/* Status transition buttons */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {entry.status === "logged" && (
              <button
                onClick={() => onUpdateStatus(entry.id, "candidate_evidence")}
                className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                转证据
              </button>
            )}
            {entry.status === "candidate_evidence" && (
              <>
                <button
                  onClick={() => onUpdateStatus(entry.id, "accepted_evidence")}
                  className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  采纳
                </button>
                <button
                  onClick={() => onUpdateStatus(entry.id, "discarded")}
                  className="rounded-md bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  忽略
                </button>
              </>
            )}
          </div>
        </div>

        {entry.details_markdown && (
          <div className="mt-3 text-[12px] leading-relaxed text-notion-gray-500 prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{entry.details_markdown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Inline Add Item ────────────────────────────────── */
function InlineAddItem({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-notion-gray-300 transition-colors hover:bg-notion-bg-secondary hover:text-notion-gray-500"
      >
        <Plus className="h-3.5 w-3.5" />
        {placeholder}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-notion-blue/30 bg-blue-50/30 px-3 py-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) { onSubmit(value.trim()); setValue(""); setOpen(false); }
          if (e.key === "Escape") { setValue(""); setOpen(false); }
        }}
        onBlur={() => { if (!value.trim()) setOpen(false); }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-notion-gray-300"
      />
      <button
        onClick={() => { if (value.trim()) { onSubmit(value.trim()); setValue(""); setOpen(false); } }}
        className="shrink-0 rounded bg-notion-blue px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-notion-blue/90"
      >
        添加
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export function CoachContextTab() {
  const { data: contextItems = [], isLoading: loadingItems } = usePerformanceContextItems();
  const createContextItem = useCreatePerformanceContextItem();
  const updateContextItem = useUpdatePerformanceContextItem();
  const { data: allProjects = [] } = useProjects();

  const [pickerOpen, setPickerOpen] = useState(false);
  const autoCreated = useRef(false);

  const activeContext = contextItems.find(c => c.status === "active") || contextItems[0] || null;

  useEffect(() => {
    if (!loadingItems && contextItems.length === 0 && !autoCreated.current && !createContextItem.isPending) {
      autoCreated.current = true;
      createContextItem.mutate({
        title: "工作上下文",
        summary: "",
        status: "active",
        priority: "medium",
        linked_project_ids: [],
      });
    }
  }, [loadingItems, contextItems.length]);

  const contextId = activeContext?.id || "";
  const { data: tasks = [] } = usePerformanceTasks(contextId);
  const { data: progressEntries = [] } = usePerformanceProgressEntries(contextId);

  const createTask = useCreatePerformanceTask(contextId);
  const updateTask = useUpdatePerformanceTask(contextId);
  const createProgress = useCreatePerformanceProgressEntry(contextId);
  const updateProgress = useUpdatePerformanceProgressEntry(contextId);

  const linkedProjects = activeContext
    ? allProjects.filter(p => activeContext.linked_project_ids.includes(p.id))
    : [];

  const handleAddProjects = (projects: Project[]) => {
    if (!activeContext) return;
    const existing = new Set(activeContext.linked_project_ids);
    const newIds = [...existing, ...projects.map(p => p.id)];
    updateContextItem.mutate({ id: activeContext.id, data: { linked_project_ids: newIds } });
    setPickerOpen(false);
  };

  const handleRemoveProject = (projectId: string) => {
    if (!activeContext) return;
    const newIds = activeContext.linked_project_ids.filter(id => id !== projectId);
    updateContextItem.mutate({ id: activeContext.id, data: { linked_project_ids: newIds } });
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeContext || title === activeContext.title) return;
    updateContextItem.mutate({ id: activeContext.id, data: { title } });
  };

  const handleUpdateSummary = (summary: string) => {
    if (!activeContext || summary === activeContext.summary) return;
    updateContextItem.mutate({ id: activeContext.id, data: { summary } });
  };

  if (loadingItems || !activeContext) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-notion-gray-400" />
      </div>
    );
  }

  const todoTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
      {/* ─── Left: Project List ─── */}
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-notion-gray-500 uppercase tracking-wider">关联项目</h2>
          <button
            onClick={() => setPickerOpen(true)}
            className="rounded p-1 text-notion-gray-500 hover:bg-notion-bg-secondary hover:text-foreground"
            title="添加项目"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {linkedProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-notion-gray-300">
              点击 + 关联项目
            </div>
          ) : (
            linkedProjects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm"
              >
                <button
                  onClick={() => handleRemoveProject(project.id)}
                  className="absolute right-2.5 top-2.5 rounded-md p-1 text-notion-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                  title="移除"
                >
                  <X className="h-3 w-3" />
                </button>
                <h3 className="text-[13px] font-semibold text-foreground pr-6 leading-snug">{project.name}</h3>
                {project.description && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-notion-gray-400 line-clamp-2">{project.description}</p>
                )}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <span key={tech} className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-notion-gray-400">{tech}</span>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <span className="text-[10px] text-notion-gray-300">+{project.tech_stack.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ─── Right: Workspace ─── */}
      <main className="space-y-8">
        {/* Context Header — inline editable */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <EditableText
            value={activeContext.title}
            onSave={handleUpdateTitle}
            placeholder="输入上下文名称"
            className="text-lg font-bold"
          />
          <div className="mt-2">
            <EditableText
              value={activeContext.summary}
              onSave={handleUpdateSummary}
              placeholder="添加描述..."
              className="text-sm text-notion-gray-400"
              multiline
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-notion-gray-300">
            <span>创建于 {new Date(activeContext.created_at).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span>
            <span className="h-1 w-1 rounded-full bg-notion-gray-300" />
            <span>{linkedProjects.length} 个关联项目</span>
            <span className="h-1 w-1 rounded-full bg-notion-gray-300" />
            <span>{todoTasks.length} 项待办</span>
          </div>
        </div>

        {/* Two-column: Progress + Tasks */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">

          {/* Progress Log */}
          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-notion-gray-500">进展记录</h3>
              <span className="text-[11px] text-notion-gray-300">{progressEntries.length} 条</span>
            </div>

            {progressEntries.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-notion-gray-300">
                暂无进展，记录你的工作成果
              </div>
            ) : (
              <div className="relative ml-1 space-y-1 border-l border-slate-100 pl-0">
                {progressEntries.map((entry) => (
                  <ProgressCard key={entry.id} entry={entry} onUpdateStatus={(id, status) => updateProgress.mutate({ entryId: id, data: { status } })} />
                ))}
              </div>
            )}

            {/* Inline add progress */}
            <InlineAddItem
              placeholder="记录新进展..."
              onSubmit={(title) => {
                createProgress.mutate({ title, details_markdown: "", status: "logged" });
              }}
            />
          </section>

          {/* Tasks */}
          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-notion-gray-500">待办任务</h3>
              <span className="text-[11px] text-notion-gray-300">{todoTasks.length}/{tasks.length}</span>
            </div>

            <div className="divide-y divide-slate-50">
              {todoTasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdate={(id, data) => updateTask.mutate({ taskId: id, data })} />
              ))}
            </div>

            {todoTasks.length === 0 && doneTasks.length === 0 && (
              <div className="py-8 text-center text-[12px] text-notion-gray-300">
                添加你的第一个任务
              </div>
            )}

            <InlineAddItem
              placeholder="添加任务..."
              onSubmit={(title) => {
                createTask.mutate({ title, status: "todo" });
              }}
            />

            {/* Completed tasks — collapsed */}
            {doneTasks.length > 0 && (
              <details className="mt-4 group">
                <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-notion-gray-300 hover:text-notion-gray-500 select-none">
                  <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                  已完成 ({doneTasks.length})
                </summary>
                <div className="mt-2 divide-y divide-slate-50">
                  {doneTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onUpdate={(id, data) => updateTask.mutate({ taskId: id, data })} />
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      </main>

      <ProjectPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleAddProjects}
        alreadyLinkedProjectIds={activeContext?.linked_project_ids || []}
      />
    </div>
  );
}
