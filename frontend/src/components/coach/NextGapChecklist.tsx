import type { CapabilityAssessment } from "@/types";

export function NextGapChecklist({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">下一等级缺口</div>
      <ul className="mt-4 space-y-2 text-sm text-notion-gray-500">
        {assessment.next_level_gaps.map((gap) => (
          <li key={gap} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
            <span>{gap}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
