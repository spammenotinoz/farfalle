"use client";

import { ResearchDepth } from "../../generated";
import { useConfigStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Gauge, Layers3, Telescope } from "lucide-react";

const depthOptions = [
  {
    value: ResearchDepth.QUICK,
    label: "Scan",
    description: "Fast source sweep",
    eta: "~15s",
    icon: Gauge,
  },
  {
    value: ResearchDepth.BALANCED,
    label: "Brief",
    description: "Balanced report",
    eta: "~45s",
    icon: Layers3,
  },
  {
    value: ResearchDepth.DEEP,
    label: "Deep",
    description: "Full research pass",
    eta: "~2 min",
    icon: Telescope,
  },
];

export function ResearchDepthControl({ compact = false }: { compact?: boolean }) {
  const { researchDepth, setResearchDepth } = useConfigStore();

  return (
    <div
      className={cn(
        "inline-grid grid-cols-3 rounded-md border bg-muted/35 p-1",
        compact ? "w-full" : "w-full sm:w-auto",
      )}
      aria-label="Research depth"
    >
      {depthOptions.map(({ value, label, description, eta, icon: Icon }) => {
        const selected = researchDepth === value;
        const etaId = `depth-eta-${value}`;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setResearchDepth(value)}
            className={cn(
              "min-w-0 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              compact
                ? "flex items-center justify-center gap-1.5"
                : "flex flex-col items-center justify-center gap-0.5",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={`${description} (${eta})`}
            aria-pressed={selected}
            aria-describedby={compact ? undefined : etaId}
          >
            <span className="flex items-center gap-1.5">
              <Icon size={13} className="shrink-0" />
              <span>{label}</span>
            </span>
            {!compact && (
              <span
                id={etaId}
                className={cn(
                  "text-[10px] tabular-nums",
                  selected
                    ? "text-muted-foreground"
                    : "text-muted-foreground/70",
                )}
              >
                {eta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
