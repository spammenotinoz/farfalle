import { memo } from "react";
import {
  AgentSearchFullResponse,
  AgentSearchStep,
  AgentSearchStepStatus,
  SearchResult,
} from "../../generated";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import { Logo } from "./search-results";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

const statusCopy = {
  [AgentSearchStepStatus.DONE]: "Done",
  [AgentSearchStepStatus.CURRENT]: "Working",
  [AgentSearchStepStatus.DEFAULT]: "Queued",
};

function compactDomain(url: string) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.split(".")[0];
  } catch {
    return url;
  }
}

const EvidenceChips = ({
  queries,
  results,
}: {
  queries: string[];
  results: SearchResult[];
}) => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    {queries.slice(0, 2).map((query, index) => (
      <span
        key={`query-${index}`}
        className="inline-flex max-w-full items-center gap-1 rounded bg-tint/10 px-2 py-0.5 text-[11px] text-tint"
      >
        <SearchIcon className="h-3 w-3 flex-shrink-0" />
        <span className="max-w-[220px] truncate">{query}</span>
      </span>
    ))}
    {results.slice(0, 4).map((result, index) => (
      <a
        key={`result-${index}`}
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Logo url={result.url} size={10} />
        <span className="max-w-[96px] truncate">{compactDomain(result.url)}</span>
      </a>
    ))}
    {queries.length + results.length === 0 && (
      <span className="text-[11px] text-muted-foreground">
        Preparing searches...
      </span>
    )}
  </div>
);

const StepIcon = ({ status }: { status: AgentSearchStepStatus }) => {
  if (status === AgentSearchStepStatus.DONE) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }

  if (status === AgentSearchStepStatus.CURRENT) {
    return (
      <span className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute h-4 w-4 rounded-full bg-tint/25 animate-ping" />
        <Loader2 className="relative h-4 w-4 animate-spin text-tint" />
      </span>
    );
  }

  return <Circle className="h-4 w-4 text-muted-foreground/35" />;
};

const StepRow = memo(
  ({
    step,
    index,
    active,
  }: {
    step: AgentSearchStep;
    index: number;
    active: boolean;
  }) => {
    const status = step.status ?? AgentSearchStepStatus.DEFAULT;
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={cn(
          "rounded-md border px-3 py-2 transition-colors",
          active
            ? "border-tint/35 bg-tint/5"
            : "border-border/60 bg-background/45",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex-shrink-0">
            <StepIcon status={status} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2">
              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-xs font-medium",
                  active ? "text-foreground" : "text-foreground/75",
                )}
                title={step.step}
              >
                {step.step}
              </p>
              <span
                className={cn(
                  "flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  status === AgentSearchStepStatus.DONE &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  status === AgentSearchStepStatus.CURRENT &&
                    "bg-tint/10 text-tint",
                  status === AgentSearchStepStatus.DEFAULT &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {statusCopy[status]}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <EvidenceChips
                    queries={step.queries || []}
                    results={step.results || []}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  },
);

StepRow.displayName = "StepRow";

const ProSearchSkeleton = () => (
  <div className="mb-3 rounded-md border bg-card/60 p-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-2.5 w-44 rounded" />
      </div>
    </div>
    <div className="mt-3 space-y-1.5">
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-11/12 rounded-md" />
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
  if (!streamingProResponse?.steps_details) {
    return isStreamingProSearch ? <ProSearchSkeleton /> : null;
  }

  const steps = streamingProResponse.steps_details;
  const doneCount = steps.filter(
    (step) => step.status === AgentSearchStepStatus.DONE,
  ).length;
  const currentIndex = steps.findIndex(
    (step) => step.status === AgentSearchStepStatus.CURRENT,
  );
  const activeIndex = currentIndex === -1 ? Math.max(doneCount - 1, 0) : currentIndex;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const currentStep = steps[activeIndex]?.step ?? "Synthesizing findings";
  const sourceCount = steps.reduce(
    (total, step) => total + (step.results?.length ?? 0),
    0,
  );

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 overflow-hidden rounded-md border bg-card/70 shadow-sm"
      aria-label="Research progress"
    >
      <div className="border-b bg-muted/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-tint/10 text-tint">
            {isStreamingProSearch ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight">
                Research in progress
              </p>
              {isStreamingProSearch && (
                <span className="h-1.5 w-1.5 rounded-full bg-tint animate-pulse" />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {currentStep}
            </p>
          </div>
          <div className="hidden flex-shrink-0 items-center gap-1.5 rounded bg-background px-2 py-1 text-[11px] text-muted-foreground sm:flex">
            <BookOpen className="h-3 w-3 text-tint" />
            {sourceCount} sources
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-tint"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="max-h-[260px] space-y-1.5 overflow-y-auto p-2">
        {steps.map((step, index) => (
          <StepRow
            key={`${step.step_number}-${step.step}`}
            step={step}
            index={index}
            active={index === activeIndex}
          />
        ))}
      </div>
    </motion.section>
  );
};
