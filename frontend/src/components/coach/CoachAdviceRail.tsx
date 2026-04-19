import type { CapabilityAssessment } from "@/types";

export function CoachAdviceRail({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  return (
    <aside className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">教练建议栏</div>
      <div className="mt-4 space-y-3">
        {assessment.suggested_actions.map((action) => (
          <div
            key={action}
            className="rounded-lg border border-dashed border-notion-blue/30 px-3 py-3 text-sm text-notion-gray-500"
          >
            {action}
          </div>
        ))}
      </div>
    </aside>
  );
}
