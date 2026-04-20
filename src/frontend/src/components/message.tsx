import React, { FC, memo, useMemo } from "react";
import { MemoizedReactMarkdown } from "./markdown";
import { SearchResult } from "../../generated";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

// ─── Citation Badge ──────────────────────────────────────────────────────
interface CitationBadgeProps {
  number: number;
  url: string;
  title?: string;
}

const CitationBadge = memo(({ number, url, title }: CitationBadgeProps) => {
  const badge = (
    <span className="inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded px-1 text-xs font-mono bg-tint/10 text-tint align-super mx-0.5">
      {number}
    </span>
  );

  if (!url) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex align-super mx-0.5"
          aria-label={title ?? url}
        >
          {badge}
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-0 overflow-hidden z-50">
        <div className="bg-card border rounded-lg overflow-hidden shadow-xl">
          <div className="p-2.5 border-b bg-muted/40">
            <div className="flex items-center gap-2 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-4 h-4 rounded"
                src={`https://www.google.com/s2/favicons?sz=16&domain=${url}`}
                alt=""
              />
              <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                {(() => {
                  try {
                    return new URL(url).hostname.replace("www.", "");
                  } catch {
                    return url;
                  }
                })()}
              </span>
            </div>
            <p className="text-xs font-medium leading-snug">{title ?? url}</p>
          </div>
          <div className="p-2 flex items-center justify-between">
            <span className="text-[11px] text-tint">View source</span>
            <ExternalLink size={10} className="text-tint" />
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

CitationBadge.displayName = "CitationBadge";

// ─── Parse [N] citations ──────────────────────────────────────────────────
interface ParsedCitation {
  type: "text" | "citation";
  value: string;
  number?: number;
  url?: string;
  title?: string;
}

function parseContentWithCitations(
  content: string,
  sources: SearchResult[] | null | undefined,
): ParsedCitation[] {
  const citationRegex = /\[(\d+)\]/g;
  const elements: ParsedCitation[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push({ type: "text", value: textBefore });
    }

    const number = parseInt(match[1], 10);
    const source = sources?.[number - 1];
    elements.push({
      type: "citation",
      value: match[0],
      number,
      url: source?.url ?? "",
      title: source?.title,
    });

    lastIndex = citationRegex.lastIndex;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) elements.push({ type: "text", value: remaining });

  return elements;
}

// ─── Streaming Cursor ─────────────────────────────────────────────────────
const StreamingCursor = memo(() => (
  <span className="streaming-cursor" aria-hidden="true" />
));
StreamingCursor.displayName = "StreamingCursor";

// ─── Main Message Component ──────────────────────────────────────────────
export const MessageComponent: FC<{
  message: { content: string; sources?: SearchResult[] | null };
  isStreaming?: boolean;
}> = ({ message, isStreaming = false }) => {
  const { content, sources } = message;

  // Split into text + citation tokens
  const tokens = useMemo(
    () => parseContentWithCitations(content, sources),
    [content, sources],
  );

  // Markdown content with all [N] markers stripped
  const markdownContent = content.replace(/\[(\d+)\]/g, "").trim();

  // Inline citation badges only (exclude text tokens)
  const citationBadges = tokens.filter((t) => t.type === "citation");

  return (
    <div className={cn("prose-answer", isStreaming && "relative")}>
      <MemoizedReactMarkdown>{markdownContent}</MemoizedReactMarkdown>

      {citationBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-border/40">
          {citationBadges.map((token) =>
            token.type === "citation" ? (
              <CitationBadge
                key={`badge-${token.number}`}
                number={token.number!}
                url={token.url!}
                title={token.title}
              />
            ) : null,
          )}
        </div>
      )}

      {isStreaming && <StreamingCursor />}
    </div>
  );
};

export const MessageComponentSkeleton = () => (
  <div className="flex flex-col gap-4 py-2">
    <Skeleton className="h-2 w-full rounded" />
    <Skeleton className="h-2 w-4/5 rounded" />
    <Skeleton className="h-2 w-3/5 rounded" />
    <Skeleton className="h-2 w-11/12 rounded" />
    <Skeleton className="h-2 w-2/3 rounded" />
  </div>
);
