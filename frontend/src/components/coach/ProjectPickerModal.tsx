import { useState } from "react";
import { X, Check } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types";

interface ProjectPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (projects: Project[]) => void;
  alreadyLinkedProjectIds?: string[];
}

export function ProjectPickerModal({
  open,
  onClose,
  onConfirm,
  alreadyLinkedProjectIds = [],
}: ProjectPickerModalProps) {
  const { data: projects = [], isLoading } = useProjects();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = projects.filter((p) => selectedIds.has(p.id));
    onConfirm(selected);
    setSelectedIds(new Set());
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">选择项目</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-notion-gray-500">
          从你的职业档案中选择项目关联到此工作上下文
        </p>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-notion-gray-400">
              加载中...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-sm text-notion-gray-400">
              暂无项目，请先在职业档案中创建项目
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((project) => {
                const isSelected = selectedIds.has(project.id);
                const isLinked = alreadyLinkedProjectIds.includes(project.id);

                return (
                  <button
                    key={project.id}
                    onClick={() => toggleSelect(project.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-notion-blue bg-blue-50/30 ring-1 ring-notion-blue"
                        : "border-gray-200 bg-white hover:border-notion-blue/30"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-notion-blue bg-notion-blue text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {project.name}
                        </span>
                        {isLinked && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            已关联
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-0.5 text-xs text-notion-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.tech_stack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded bg-notion-bg-secondary px-1.5 py-0.5 text-[10px] text-notion-gray-500"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.tech_stack.length > 4 && (
                            <span className="text-[10px] text-notion-gray-400">
                              +{project.tech_stack.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-notion-gray-500">
            {selectedIds.size > 0 ? `${selectedIds.size} 个项目已选` : "未选择项目"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white hover:bg-notion-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
