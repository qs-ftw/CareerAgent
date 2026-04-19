import type { CapabilityAssessment } from "@/types";

export function CoreLevelCard({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  const isUnproven = assessment.core_level === "未证明";
  const isPending = assessment.status === "pending";

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${
      isPending ? "bg-blue-50 border-blue-200 animate-pulse" : 
      isUnproven ? "bg-red-50 border-red-200" : 
      "bg-white border-border"
    }`}>
      <div className={`text-sm font-medium ${
        isPending ? "text-blue-600" :
        isUnproven ? "text-red-600" : 
        "text-notion-gray-500"
      }`}>
        {isPending ? "正在评估中" : "当前被证明达到"}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className={`rounded-2xl px-4 py-2 text-3xl font-extrabold text-white ${
          isPending ? "bg-blue-400" :
          isUnproven ? "bg-red-400" : 
          "bg-notion-blue"
        }`}>
          {isPending ? "..." : assessment.core_level}
        </div>
        <p className={`text-sm leading-6 ${
          isPending ? "text-blue-700 font-medium" :
          isUnproven ? "text-red-700 font-medium" : 
          "text-notion-gray-500"
        }`}>
          {assessment.core_reasoning_markdown}
        </p>
      </div>
    </section>
  );
}
