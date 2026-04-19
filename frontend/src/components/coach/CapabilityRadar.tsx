import type { CapabilityAssessment } from "@/types";

const DIMENSIONS = [
  ["exploration_innovation", "探索创新"],
  ["execution_delivery", "高执行力"],
  ["core_backbone", "核心骨干"],
  ["breakthrough_problem_solving", "攻坚突破"],
  ["collaboration_influence", "协调赋能"],
] as const;

const LEVEL_TO_SCORE: Record<string, number> = {
  未证明: 0,
  C1: 1,
  C2: 2,
  C3: 3,
  C4: 4,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

function polar(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(radians), cy + r * Math.sin(radians)];
}

export function CapabilityRadar({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  const points = DIMENSIONS.map(([key], index) => {
    const level = assessment.dimension_levels[key]?.level ?? "未证明";
    const score = LEVEL_TO_SCORE[level] ?? 0;
    const [x, y] = polar(110, 110, 22 * score, index * 72);
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">五维画像</div>
      <div className="mt-4 flex items-center gap-8">
        <svg viewBox="0 0 220 220" className="h-56 w-56">
          <polygon
            points="110,22 193,83 161,182 59,182 27,83"
            fill="#f7f7f5"
            stroke="#d6d3d1"
          />
          <polygon
            points={points}
            fill="rgba(51, 112, 255, 0.18)"
            stroke="#3370ff"
            strokeWidth="3"
          />
        </svg>
        <div className="space-y-3">
          {DIMENSIONS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-6 text-sm">
              <span className="text-notion-gray-500">{label}</span>
              <span className="font-semibold text-foreground">
                {assessment.dimension_levels[key]?.level ?? "未证明"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
