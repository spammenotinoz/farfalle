import { AssistantMessageContent } from "./assistant-message";
import { Separator } from "@/components/ui/separator";
import { UserMessageContent } from "./user-message";
import { memo, useEffect, useState } from "react";
import {
  AgentSearchFullResponse,
  AgentSearchStepStatus,
  ChatMessage,
  MessageRole,
  SearchResult,
} from "../../generated";
import _ from "lodash";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { SearchIcon, WandSparklesIcon, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Logo } from "./search-results";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "./ui/timeline";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const StepSection = ({
  step,
  queries,
  results,
}: {
  step: string;
  queries: string[];
  results: SearchResult[];
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex flex-col gap-2 text-sm transition-all duration-300 ease-in-out",
          queries.length > 0
            ? "opacity-100"
            : "opacity-50",
        )}
      >
        {queries.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <SearchIcon className="h-3 w-3" />
            <span className="text-xs font-medium">Searching</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {queries.map((query, index) => (
            <div
              key={`query-${index}`}
              className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium"
            >
              <span>{query}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 text-sm transition-all duration-300 ease-in-out",
          results.length > 0
            ? "opacity-100"
            : "opacity-50",
        )}
      >
        {results.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs font-medium">Found {results.length} sources</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {results.slice(0, 6).map((result, index) => {
            const formattedUrl = new URL(result.url).hostname
              .split(".")
              .slice(-2, -1)[0];
            return (
              <a
                className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium hover:bg-muted transition-colors"
                href={result.url}
                target="_blank"
                key={`result-${index}`}
              >
                <Logo url={result.url} size={12} />
                <span className="truncate max-w-[100px]">{formattedUrl}</span>
              </a>
            );
          })}
          {results.length > 6 && (
            <span className="text-xs text-muted-foreground px-1 py-1">
              +{results.length - 6} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProSearchSkeleton = () => {
  return (
    <div className="w-full rounded-xl border bg-card/50 p-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-tint/10 flex items-center justify-center">
          <WandSparklesIcon className="h-5 w-5 text-tint" />
        </div>
        <div>
          <h1 className="text-lg font-medium">Expert Search</h1>
          <p className="text-sm text-muted-foreground">Analyzing your question...</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-3 ml-8">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
};

export const ProSearchRender = ({
  streamingProResponse,
  isStreamingProSearch = false,
}: {
  streamingProResponse: AgentSearchFullResponse | null;
  isStreamingProSearch?: boolean;
}) => {
  const [accordionValues, setAccordionValues] = useState<string[]>([]);

  useEffect(() => {
    if (!streamingProResponse?.steps_details) {
      return;
    }
    const stepDetails = streamingProResponse.steps_details;
    if (!stepDetails) {
      return;
    }
    const currentSteps = stepDetails
      .map((step, index) => ({ index, status: step.status }))
      .filter((step) => step.status === AgentSearchStepStatus.CURRENT)
      .map((step) => step.index.toString());

    setAccordionValues(currentSteps);
  }, [streamingProResponse]);

  if (!streamingProResponse?.steps_details) {
    return isStreamingProSearch ? <ProSearchSkeleton /> : null;
  }
  const { steps_details: stepDetails } = streamingProResponse;

  const getStatusIcon = (status: AgentSearchStepStatus) => {
    switch (status) {
      case AgentSearchStepStatus.DONE:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case AgentSearchStepStatus.CURRENT:
        return (
          <div className="relative">
            <Circle className="h-5 w-5 text-tint" />
            <Loader2 className="h-3 w-3 absolute top-1 left-1 animate-spin text-white" />
          </div>
        );
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/30" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl border bg-card/50 overflow-hidden mb-6"
    >
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="w-10 h-10 rounded-lg bg-tint/10 flex items-center justify-center">
          <WandSparklesIcon className="h-5 w-5 text-tint" />
        </div>
        <div>
          <h1 className="text-lg font-medium">Expert Search</h1>
          <p className="text-sm text-muted-foreground">
            {stepDetails.length} steps planned
          </p>
        </div>
      </div>

      <div className="p-4">
        <Timeline className="w-full">
          {stepDetails.map(({ step, queries, results, status }, index) => {
            const isLast = index === stepDetails.length - 1;
            const stepStatus = status ?? AgentSearchStepStatus.DEFAULT;
            return (
              <TimelineItem key={index} status="default">
                <TimelineDot className="mt-1">
                  {getStatusIcon(stepStatus)}
                </TimelineDot>
                {!isLast && <TimelineLine done={stepStatus === AgentSearchStepStatus.DONE} />}
                <TimelineContent className="w-full pb-4">
                  <Accordion
                    type="multiple"
                    className="w-full"
                    value={accordionValues}
                    onValueChange={setAccordionValues}
                  >
                    <AccordionItem
                      value={index.toString()}
                      className={cn(
                        isLast ? "border-b-0" : "",
                        "px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      )}
                      disabled={status !== AgentSearchStepStatus.DONE && status !== AgentSearchStepStatus.CURRENT}
                    >
                      <AccordionTrigger className="w-full text-left hover:no-underline py-2">
                        <span className="text-sm font-medium">{step}</span>
                      </AccordionTrigger>
                      <AccordionContent className="w-full px-2 pt-2">
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
