import type { CapabilityAssessment } from "@/types";

import { CoachAdviceRail } from "./CoachAdviceRail";
import { CapabilityRadar } from "./CapabilityRadar";
import { CoreLevelCard } from "./CoreLevelCard";
import { EvidenceReasonList } from "./EvidenceReasonList";
import { NextGapChecklist } from "./NextGapChecklist";

export function CoachOverview({
  assessment,
}: {
  assessment: CapabilityAssessment;
}) {
  const isPending = assessment.status === "pending";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-6">
        <CoreLevelCard assessment={assessment} />
        {!isPending && (
          <>
            <CapabilityRadar assessment={assessment} />
            <EvidenceReasonList assessment={assessment} />
            <NextGapChecklist assessment={assessment} />
          </>
        )}
      </div>
      {!isPending && <CoachAdviceRail assessment={assessment} />}
    </div>
  );
}
