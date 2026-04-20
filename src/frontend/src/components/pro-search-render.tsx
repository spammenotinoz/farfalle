import { UserMessageContent } from "./user-message";
import { Separator } from "@/components/ui/separator";
import { memo, useEffect, useState } from "react";
import {
  AgentSearchFullResponse,
  AgentSearchStepStatus,
  ChatMessage,
  MessageRole,
  SearchResult,
} from "../../generated";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  SearchIcon,
  WandSparklesIcon,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Logo } from "./search-results";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineLine,
} from "./ui/timeline";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { motion } from "framer-motion";

const StepSection = ({
  queries,
  results,
}: {
  step: string;
  queries: string[];
  results: SearchResult[];
}) => (
  <div className="flex flex-col gap-3">
    {queries.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {queries.map((q, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full text-xs"
          >
            <SearchIcon className="h-3 w-3 flex-shrink-0" />
            {q}
          </span>
        ))}
      </div>
    )}

    {results.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {results.slice(0, 8).map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full text-xs hover:bg-muted transition-colors"
          >
            <Logo url={r.url} size={10} />
            {(() => {
              try {
                return new URL(r.url).hostname.split(".").slice(-2, -1)[0];
              } catch {
                return r.url;
              }
            })()}
          </a>
        ))}
        {results.length > 8 && (
          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
            +{results.length - 8}
          </span>
        )}
      </div>
    )}
  </div>
);

const ProSearchSkeleton = () => (
  <div className="w-full rounded-xl border bg-card/40 p-4 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-tint/10 flex items-center justify-center">
        <WandSparklesIcon className="h-4 w-4 text-tint" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-36 mt-1 rounded" />
      </div>
    </div>
    <Separator />
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <div className="pl-6 space-y-2">
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    </div>
  </div>
);

export const ProSearchRender = ({
  streamingProResponse,
  isStreamingProSearch = false,
}: {
  streamingProResponse: AgentSearchFullResponse | null;
  isStreamingProSearch?: boolean;
}) => {
  const [openSteps, setOpenSteps] = useState<string[]>([]);

  useEffect(() => {
    if (!streamingProResponse?.steps_details) return;
    const current = streamingProResponse.steps_details
      .map((s, i) => ({ i, status: s.status }))
      .filter((s) => s.status === AgentSearchStepStatus.CURRENT)
      .map((s) => s.i.toString());
    setOpenSteps(current);
  }, [streamingProResponse]);

  if (!streamingProResponse?.steps_details) {
    return isStreamingProSearch ? <ProSearchSkeleton /> : null;
  }

  const { steps_details: steps } = streamingProResponse;

  const getIcon = (status: AgentSearchStepStatus) => {
    switch (status) {
      case AgentSearchStepStatus.DONE:
        return (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        );
      case AgentSearchStepStatus.CURRENT:
        return (
          <div className="relative">
            <Circle className="h-4 w-4 text-tint" />
            <Loader2 className="h-2.5 w-2.5 absolute top-[3px] left-[3px] animate-spin text-white" />
          </div>
        );
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/30" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card/40 overflow-hidden mb-4"
    >
      {/* Compact header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
        <div className="w-8 h-8 rounded-lg bg-tint/10 flex items-center justify-center flex-shrink-0">
          <WandSparklesIcon className="h-4 w-4 text-tint" />
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">Expert Search</p>
          <p className="text-xs text-muted-foreground">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <Timeline className="w-full">
          {steps.map(({ step, queries, results, status }, index) => {
            const isLast = index === steps.length - 1;
            const stepStatus = status ?? AgentSearchStepStatus.DEFAULT;
            return (
              <TimelineItem key={index} status="default">
                <TimelineDot className="mt-0.5">
                  {getIcon(stepStatus)}
                </TimelineDot>
                {!isLast && (
                  <TimelineLine done={stepStatus === AgentSearchStepStatus.DONE} />
                )}
                <TimelineContent className="w-full pb-3">
                  <Accordion
                    type="multiple"
                    className="w-full"
                    value={openSteps}
                    onValueChange={setOpenSteps}
                  >
                    <AccordionItem
                      value={index.toString()}
                      className={cn(
                        isLast ? "border-b-0" : "",
                        "px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors",
                      )}
                      disabled={
                        stepStatus !== AgentSearchStepStatus.DONE &&
                        stepStatus !== AgentSearchStepStatus.CURRENT
                      }
                    >
                      <AccordionTrigger className="w-full text-left hover:no-underline py-1">
                        <span className="text-xs font-medium text-foreground/80">
                          {step}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="w-full px-1 pt-1">
                        <StepSection
                          step={step}
                          queries={queries || []}
                          results={results || []}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </div>
    </motion.div>
  );
};
