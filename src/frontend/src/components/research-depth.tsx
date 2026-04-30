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
    icon: Gauge,
  },
  {
    value: ResearchDepth.BALANCED,
    label: "Brief",
    description: "Balanced report",
    icon: Layers3,
  },
  {
    value: ResearchDepth.DEEP,
    label: "Deep",
    description: "Full research pass",
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
      {depthOptions.map(({ value, label, description, icon: Icon }) => {
        const selected = researchDepth === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setResearchDepth(value)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={description}
            aria-pressed={selected}
          >
            <Icon size={13} className="shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
