import { WeeklyActionSuggestion } from "@/types";
import { RefreshCw } from "lucide-react";

interface WeeklyActionListProps {
  suggestions: WeeklyActionSuggestion[];
  reasoning: string;
  onRefresh: () => void;
}

export function WeeklyActionList({ suggestions, reasoning, onRefresh }: WeeklyActionListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-notion-gray-900">本周行动建议</h3>
          <p className="text-sm text-notion-gray-500">{reasoning}</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium text-notion-gray-600 shadow-sm transition-colors hover:bg-notion-bg-secondary"
          title="重新生成建议"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重新生成
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  suggestion.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : suggestion.priority === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {suggestion.priority.toUpperCase()}
              </span>
            </div>
            <h4 className="mb-1 font-medium text-notion-gray-900">{suggestion.title}</h4>
            <p className="text-sm text-notion-gray-600">{suggestion.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}