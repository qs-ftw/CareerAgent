import { PersonalObjective } from "@/types";
import { Target, CheckCircle2 } from "lucide-react";

interface OkrListProps {
  objectives: PersonalObjective[];
}

export function OkrList({ objectives }: OkrListProps) {
  if (objectives.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-notion-gray-300 bg-notion-bg-secondary p-12 text-center">
        <Target className="mx-auto mb-4 h-12 w-12 text-notion-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-notion-gray-900">暂无个人 OKR</h3>
        <p className="text-sm text-notion-gray-500">
          通过与绩效教练沟通，制定你的个人 OKR 以量化你的职业成长。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-notion-gray-900">活跃 OKRs</h3>
      <div className="space-y-4">
        {objectives.map((objective) => (
          <div key={objective.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-notion-bg-secondary px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-notion-blue" />
                  <h4 className="text-base font-semibold text-notion-gray-900">
                    {objective.title}
                  </h4>
                  <span className="rounded bg-notion-blue/10 px-2 py-0.5 text-xs font-medium text-notion-blue">
                    {objective.status.toUpperCase()}
                  </span>
                </div>
                {objective.target_core_level && (
                  <div className="text-sm text-notion-gray-500">
                    目标级别: <span className="font-medium">{objective.target_core_level}</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-notion-gray-600">{objective.summary}</p>
            </div>
            <div className="divide-y">
              {objective.key_results.map((kr) => (
                <div key={kr.id} className="px-6 py-4 transition-colors hover:bg-notion-bg-secondary/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 ${kr.status === 'completed' ? 'text-green-500' : 'text-notion-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-notion-gray-900">{kr.title}</span>
                        <span className="text-xs font-medium text-notion-gray-500">
                          {kr.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-notion-gray-500">{kr.result_definition}</p>
                      
                      {/* Simple progress bar if progress exists */}
                      {kr.progress_value_json && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-notion-gray-500">
                            <span>进度</span>
                            <span>{Math.round((kr.progress_value_json.current || 0) / (kr.progress_value_json.target || 100) * 100)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-notion-gray-100">
                            <div 
                              className="h-1.5 rounded-full bg-notion-blue transition-all" 
                              style={{ width: `${Math.min(100, (kr.progress_value_json.current || 0) / (kr.progress_value_json.target || 100) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
