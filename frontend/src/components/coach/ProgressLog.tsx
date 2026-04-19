import { Award, CheckCircle2, Plus, XCircle } from "lucide-react";
import type { PerformanceProgressEntry } from "@/types";
import ReactMarkdown from "react-markdown";

interface ProgressLogProps {
  entries: PerformanceProgressEntry[];
  onAddEntry: () => void;
  onUpdateStatus: (entryId: string, status: string) => void;
}

export function ProgressLog({ entries, onAddEntry, onUpdateStatus }: ProgressLogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "candidate_evidence":
        return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">待转证据</span>;
      case "accepted_evidence":
        return <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">已转证据</span>;
      case "discarded":
        return <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">已忽略</span>;
      default:
        return <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">已记录</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold text-foreground">进展日志</h3>
        <button
          onClick={onAddEntry}
          className="flex items-center gap-1.5 text-xs font-medium text-notion-blue hover:underline"
        >
          <Plus className="h-3 w-3" />
          <span>记录进展</span>
        </button>
      </div>

      <div className="space-y-6 pt-2">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-xs text-notion-gray-400">
            暂无进展记录
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-gray-100 last:before:h-2">
              <div className="absolute left-[-4.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-notion-blue ring-4 ring-white" />
              <div className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-foreground leading-tight">{entry.title}</h4>
                      {getStatusBadge(entry.status)}
                    </div>
                    <span className="block text-[10px] font-medium text-notion-gray-400">
                      {entry.occurred_at ? new Date(entry.occurred_at).toLocaleDateString() : "近期记录"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {entry.status === "logged" && (
                      <button
                        onClick={() => onUpdateStatus(entry.id, "candidate_evidence")}
                        className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        标记为证据
                      </button>
                    )}
                    {entry.status === "candidate_evidence" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateStatus(entry.id, "accepted_evidence")}
                          className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          接受
                        </button>
                        <button
                          onClick={() => onUpdateStatus(entry.id, "discarded")}
                          className="flex items-center gap-1 rounded bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          <XCircle className="h-3 w-3" />
                          忽略
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {entry.details_markdown && (
                  <div className="mt-3 prose prose-xs prose-neutral max-w-none text-xs leading-relaxed text-notion-gray-600">
                    <ReactMarkdown>{entry.details_markdown}</ReactMarkdown>
                  </div>
                )}

                {entry.linked_achievement_ids && entry.linked_achievement_ids.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 border-t pt-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-notion-blue/5 px-2 py-0.5 text-[10px] font-medium text-notion-blue">
                      <Award className="h-3 w-3" />
                      关联了 {entry.linked_achievement_ids.length} 个成就
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
