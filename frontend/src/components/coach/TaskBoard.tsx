import { CheckCircle, Circle, Clock, Plus } from "lucide-react";
import type { PerformanceTask } from "@/types";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: PerformanceTask[];
  onAddTask: () => void;
  onUpdateTask: (taskId: string, data: { status?: string; title?: string }) => void;
}

export function TaskBoard({ tasks, onAddTask, onUpdateTask }: TaskBoardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold text-foreground">计划任务</h3>
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 text-xs font-medium text-notion-blue hover:underline"
        >
          <Plus className="h-3 w-3" />
          <span>添加任务</span>
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-notion-gray-400">
            没有计划中的任务
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center justify-between gap-3 rounded-lg border bg-white p-3 shadow-sm transition-colors hover:border-notion-blue/30"
            >
              <div className="flex flex-1 items-start gap-3">
                <button
                  onClick={() => onUpdateTask(task.id, { 
                    status: task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done" 
                  })}
                  className="mt-0.5 shrink-0 hover:opacity-80"
                  title="更改状态"
                >
                  {getStatusIcon(task.status)}
                </button>
                <div className="space-y-1">
                  <p className={cn(
                    "text-sm font-medium", 
                    task.status === "done" && "text-notion-gray-400 line-through"
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-notion-gray-500 line-clamp-2">{task.description}</p>
                  )}
                </div>
              </div>
              {task.due_date && (
                <span className="shrink-0 text-[10px] text-notion-gray-400">
                  截止: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
