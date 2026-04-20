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
import { ExternalLink, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

// ─── Citation Badge ──────────────────────────────────────────────────────
interface CitationBadgeProps {
  number: number;
  url: string;
  title?: string;
}

const CitationBadge = memo(({ number, url, title }: CitationBadgeProps) => {
  const badge = (
    <span className="citation-badge inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded px-1 text-xs font-mono bg-tint/10 text-tint align-super mx-0.5">
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
                  try { return new URL(url).hostname.replace("www.", ""); }
                  catch { return url; }
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

// ─── Streaming Cursor ─────────────────────────────────────────────────────
const StreamingCursor = memo(() => (
  <span className="streaming-cursor" aria-hidden="true" />
));
StreamingCursor.displayName = "StreamingCursor";

// ─── Key Takeaways Box ──────────────────────────────────────────────────
const KeyTakeawaysBox = memo(({ content }: { content: string }) => {
  // Extract bullet points after "### Key Takeaways"
  const lines = content.split("\n").filter(l => l.startsWith("- ") || l.startsWith("* "));
  if (lines.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="key-takeaways-box"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} className="text-tint flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground">Key Takeaways</span>
      </div>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/85 flex gap-2">
            <span className="text-tint font-medium mt-0.5 flex-shrink-0">•</span>
            <span>{line.replace(/^[-*]\s/, "").trim()}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});
KeyTakeawaysBox.displayName = "KeyTakeawaysBox";

// ─── Collapsible Section ────────────────────────────────────────────────
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="research-section">
      <button
        className="research-section-header"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-tint/70" />
          <span className="text-sm font-medium text-foreground/80">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="research-section-body">{children}</div>}
    </div>
  );
};

// ─── Custom Markdown Components ─────────────────────────────────────────
interface MarkdownComponentsProps {
  isStreaming?: boolean;
  citationBadges: React.ReactNode[];
}

const markdownComponents = {
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full rounded-lg my-4"
      {...props}
    />
  ),
  table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left px-3 py-2 border-b bg-muted/50 font-semibold text-foreground/80" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-3 py-2 border-b border-border/40 text-foreground/80" {...props}>{children}</td>
  ),
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-tint underline underline-offset-2 hover:opacity-80"
      {...props}
    >
      {children}
    </a>
  ),
};

// ─── Answer Body (parsed markdown with section detection) ────────────────
interface AnswerBodyProps {
  content: string;
  sources: SearchResult[] | null | undefined;
  isStreaming: boolean;
}

const AnswerBody = memo(({ content, sources, isStreaming }: AnswerBodyProps) => {
  // Strip [N] citations for markdown rendering
  const markdownContent = content.replace(/\[(\d+)\]/g, "").trim();

  // Parse citation badges
  const citationBadges = useMemo(() => {
    const regex = /\[(\d+)\]/g;
    const badges: React.ReactNode[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const num = parseInt(match[1], 10);
      const source = sources?.[num - 1];
      badges.push(
        <CitationBadge
          key={`badge-${num}-${match.index}`}
          number={num}
          url={source?.url ?? ""}
          title={source?.title}
        />
      );
    }
    return badges;
  }, [content, sources]);

  // Detect Key Takeaways section
  const hasKeyTakeaways = /[#\s]*key\s*takeaways/i.test(markdownContent);

  // Split content at Key Takeaways for special rendering
  const splitContent = markdownContent.split(/(?=#\s*Key\s*Takeaways)/i);

  return (
    <div className="space-y-4">
      {splitContent.map((section, i) => {
        if (i === 0) {
          // First section: render as markdown, but strip Key Takeaways heading
          const cleaned = section.replace(/^#+\s*Key\s*Takeaways.*?\n*/im, "").trim();
          if (!cleaned) return null;
          return (
            <div key="main" className="prose-answer">
              <MemoizedReactMarkdown components={markdownComponents}>
                {cleaned}
              </MemoizedReactMarkdown>
            </div>
          );
        }
        // Key Takeaways section: extract bullets and render as box
        return <KeyTakeawaysBox key="takeaways" content={section} />;
      })}

      {citationBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground mr-1">Sources:</span>
          {citationBadges}
        </div>
      )}

      {isStreaming && <StreamingCursor />}
    </div>
  );
});

AnswerBody.displayName = "AnswerBody";

// ─── Main Message Component ──────────────────────────────────────────────
export const MessageComponent: FC<{
  message: { content: string; sources?: SearchResult[] | null };
  isStreaming?: boolean;
}> = ({ message, isStreaming = false }) => {
  return (
    <div className={cn(isStreaming && "relative")}>
      <AnswerBody content={message.content} sources={message.sources} isStreaming={isStreaming} />
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
