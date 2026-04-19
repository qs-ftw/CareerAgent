import type { CapabilityAssessment } from "@/types";

export function EvidenceReasonList({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">等级解释</div>
      <div className="mt-4 space-y-3">
        {assessment.evidence_links.map((item) => (
          <div key={item.source_id} className="rounded-lg bg-notion-warm-white px-4 py-3">
            <div className="font-medium text-foreground">{item.title}</div>
            <div className="mt-1 text-sm text-notion-gray-500">{item.summary}</div>
            <div className="mt-2 text-xs text-notion-blue">
              支持维度：{item.dimensions.join(" / ")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
