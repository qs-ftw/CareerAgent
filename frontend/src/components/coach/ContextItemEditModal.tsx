import { useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import type { Project } from "@/types";

interface ContextItemEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
    status: string;
  }) => void;
  isSubmitting: boolean;
  initialData: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
  };
  projects: Project[];
}

export function ContextItemEditModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
  projects,
}: ContextItemEditModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [summary, setSummary] = useState(initialData.summary);
  const [priority, setPriority] = useState(initialData.priority);

  if (!open) return null;

  const linkedProjects = projects.filter((p) =>
    initialData.linked_project_ids.includes(p.id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      summary,
      priority,
      linked_project_ids: initialData.linked_project_ids,
      status: "active",
    });
  };

  const handleClose = () => {
    setTitle(initialData.title);
    setSummary(initialData.summary);
    setPriority(initialData.priority);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">创建工作上下文</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="例如：项目 A 开发、Q3 绩效目标"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">简要描述</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="描述此工作上下文的目标和范围..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          {linkedProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium">关联项目</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {linkedProjects.map((project) => (
                  <span
                    key={project.id}
                    className="inline-flex items-center gap-1 rounded-md bg-notion-bg-secondary px-2.5 py-1 text-xs font-medium text-notion-gray-700"
                  >
                    {project.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white hover:bg-notion-blue/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
