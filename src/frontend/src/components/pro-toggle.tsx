"use client";

import { WandSparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useConfigStore } from "@/stores";
import { Switch } from "./ui/switch";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "./ui/separator";
import { env } from "@/env.mjs";

const ProToggle = () => {
  const { proMode, toggleProMode } = useConfigStore();

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "group flex items-center justify-end gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 hover:text-primary transition-colors",
            !env.NEXT_PUBLIC_PRO_MODE_ENABLED && "opacity-50 hover:cursor-not-allowed",
          )}
        >
          <div className="flex items-center gap-2">
            <WandSparklesIcon
              size={14}
              className={cn(
                "transition-colors",
                proMode ? "text-tint" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span
              className={cn(
                "font-medium text-xs transition-colors",
                proMode ? "text-tint" : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {proMode ? "Agent" : "Direct"}
            </span>
          </div>
          <Switch
            disabled={!env.NEXT_PUBLIC_PRO_MODE_ENABLED}
            checked={proMode}
            onCheckedChange={toggleProMode}
            className="data-[state=checked]:bg-tint"
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="top">
        <div className="flex flex-col items-start rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-tint/10 flex items-center justify-center">
              <WandSparklesIcon className="w-4 h-4 text-tint" />
            </div>
            <div className="text-base font-medium">
              <span className="text-tint">Research Agent</span>
            </div>
          </div>
          <Separator className="mb-3" />
          <div className="text-sm gap-y-2 flex flex-col text-muted-foreground">
            <div>
              Agent mode plans multiple searches, fuses results, reads source pages,
              and then synthesizes a deeper report.
            </div>
            <div className="text-xs text-muted-foreground/70 pt-1">
              Recommended for complex research questions.
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProToggle;
