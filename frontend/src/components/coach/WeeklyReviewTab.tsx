import { useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";

import { useGenerateWeeklyReview, useWeeklyReviews, useUpdateWeeklyReview } from "@/hooks/useWeeklyReview";
import { WeeklyReportViewer } from "./WeeklyReportViewer";
import { SelfReflectionEditor } from "./SelfReflectionEditor";

export function WeeklyReviewTab() {
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { data: reviews = [] } = useWeeklyReviews();
  const generateReview = useGenerateWeeklyReview();
  const updateReview = useUpdateWeeklyReview();

  const weekStartStr = format(selectedWeek, "yyyy-MM-dd");
  const weekEndStr = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const currentReview = reviews.find(
    (r) => r.week_start.startsWith(weekStartStr)
  );

  const handlePrevWeek = () => setSelectedWeek(subWeeks(selectedWeek, 1));
  const handleNextWeek = () => setSelectedWeek(subWeeks(selectedWeek, -1));

  const handleGenerate = () => {
    generateReview.mutate({
      week_start: weekStartStr,
      week_end: weekEndStr,
    });
  };

  const handleSaveReflection = (content: string) => {
    if (!currentReview) return;
    updateReview.mutate({
      id: currentReview.id,
      data: { self_reflection_markdown: content },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevWeek} className="rounded-full p-1 hover:bg-notion-bg-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-medium">
            {format(selectedWeek, "yyyy年MM月dd日", { locale: zhCN })} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), "MM月dd日", { locale: zhCN })}
          </div>
          <button onClick={handleNextWeek} className="rounded-full p-1 hover:bg-notion-bg-secondary">
            <ChevronRight size={20} />
          </button>
        </div>
        {!currentReview && (
          <button
            onClick={handleGenerate}
            disabled={generateReview.isPending}
            className="flex items-center gap-2 rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Wand2 size={16} />
            {generateReview.isPending ? "正在生成..." : "生成本周复盘"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          <WeeklyReportViewer content={currentReview?.manager_report_markdown || ""} />
        </div>
        <div className="space-y-6">
          <SelfReflectionEditor
            initialContent={currentReview?.self_reflection_markdown || ""}
            onSave={handleSaveReflection}
            isSaving={updateReview.isPending}
          />
          {currentReview?.new_evidence_json && currentReview.new_evidence_json.length > 0 && (
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-foreground">本周新增证据</div>
              <div className="space-y-2">
                {currentReview.new_evidence_json.map((ev: any, i: number) => (
                  <div key={i} className="rounded-lg bg-notion-warm-white px-3 py-2 text-xs text-notion-gray-500">
                    {ev.title || ev}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
