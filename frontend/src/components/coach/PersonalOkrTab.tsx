import { usePersonalOkrs, useWeeklyActionSuggestions } from "@/hooks/usePersonalOkr";
import { OkrList } from "./OkrList";
import { WeeklyActionList } from "./WeeklyActionList";
import { Loader2, Sparkles } from "lucide-react";

export function PersonalOkrTab() {
  const { 
    data: objectives, 
    isLoading: isOkrLoading, 
    isError: isOkrError 
  } = usePersonalOkrs();
  
  const { 
    data: suggestions, 
    isFetching: isSuggestionsFetching, 
    isError: isSuggestionsError,
    refetch: refetchSuggestions
  } = useWeeklyActionSuggestions();

  const isInitialLoading = isOkrLoading;

  if (isInitialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-notion-blue" />
        <span className="ml-3 text-notion-gray-600">正在加载 OKR...</span>
      </div>
    );
  }

  if (isOkrError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
        加载数据时出错，请稍后重试。
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        {isSuggestionsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            生成行动建议失败，请稍后重试。
          </div>
        )}
        {!suggestions && !isSuggestionsFetching && (
          <div className="rounded-xl border border-dashed border-notion-gray-300 bg-notion-bg-secondary p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-notion-blue opacity-50" />
            <h3 className="mt-4 text-sm font-medium text-notion-gray-900">还没有本周行动建议</h3>
            <p className="mt-1 text-sm text-notion-gray-500">
              点击下方按钮，由绩效教练基于你的 OKR 和工作上下文生成专属建议。
            </p>
            <div className="mt-6">
              <button
                onClick={() => refetchSuggestions()}
                className="inline-flex items-center rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90"
              >
                生成本周行动建议
              </button>
            </div>
          </div>
        )}

        {isSuggestionsFetching && (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-notion-blue" />
            <h3 className="mt-4 text-sm font-medium text-notion-gray-900">正在通过 AI 生成建议...</h3>
            <p className="mt-1 text-sm text-notion-gray-500">
              这可能需要 10-20 秒，请耐心等待。
            </p>
          </div>
        )}

        {suggestions && !isSuggestionsFetching && (
          <WeeklyActionList 
            suggestions={suggestions.suggestions} 
            reasoning={suggestions.reasoning}
            onRefresh={() => refetchSuggestions()}
          />
        )}
      </div>
      
      {objectives && (
        <OkrList objectives={objectives} />
      )}
    </div>
  );
}
