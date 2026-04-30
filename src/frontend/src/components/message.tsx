import React, { FC, memo } from "react";
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
import type { Components } from "react-markdown";

interface CitationBadgeProps {
  number: number;
  url: string;
  title?: string;
}

const CitationBadge = memo(({ number, url, title }: CitationBadgeProps) => {
  const badge = (
    <span className="citation-badge inline-flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded px-1 text-xs font-mono bg-tint/10 text-tint align-super mx-0.5">
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
        <div className="bg-card border rounded-md overflow-hidden shadow-xl">
          <div className="p-2.5 border-b bg-muted/40">
            <div className="flex items-center gap-2 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-4 h-4 rounded"
                src={`https://www.google.com/s2/favicons?sz=16&domain=${url}`}
                alt=""
              />
              <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                {formatHostname(url)}
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

const StreamingCursor = memo(() => (
  <span className="streaming-cursor" aria-hidden="true" />
));
StreamingCursor.displayName = "StreamingCursor";

function formatHostname(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function replaceCitationText(
  text: string,
  sources: SearchResult[] | null | undefined,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const number = Number(match[1]);
    const source = sources?.[number - 1];
    parts.push(
      <CitationBadge
        key={`citation-${number}-${match.index}`}
        number={number}
        url={source?.url ?? ""}
        title={source?.title}
      />,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderCitations(
  node: React.ReactNode,
  sources: SearchResult[] | null | undefined,
): React.ReactNode {
  if (typeof node === "string") {
    return replaceCitationText(node, sources);
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={index}>
        {renderCitations(child, sources)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return React.cloneElement(
      node,
      {},
      renderCitations(props.children, sources),
    );
  }

  return node;
}

const createMarkdownComponents = (
  sources: SearchResult[] | null | undefined,
): Components => ({
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full rounded-md my-4"
      {...props}
    />
  ),
  table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4 rounded-md border">
      <table className="w-full min-w-[620px] text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="text-left px-3 py-2 border-b bg-muted/50 font-semibold text-foreground/80"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-3 py-2 border-b border-border/40 text-foreground/80 align-top" {...props}>
      {renderCitations(children, sources)}
    </td>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{renderCitations(children, sources)}</p>
  ),
  li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li {...props}>{renderCitations(children, sources)}</li>
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
});

interface AnswerBodyProps {
  content: string;
  sources: SearchResult[] | null | undefined;
  isStreaming: boolean;
}

const AnswerBody = memo(({ content, sources, isStreaming }: AnswerBodyProps) => {
  const markdownContent = content.trim();
  const markdownComponents = createMarkdownComponents(sources);

  return (
    <TooltipProvider>
      <div className="prose-answer">
        <MemoizedReactMarkdown components={markdownComponents}>
          {markdownContent}
        </MemoizedReactMarkdown>
        {isStreaming && <StreamingCursor />}
      </div>
    </TooltipProvider>
  );
});

AnswerBody.displayName = "AnswerBody";

export const MessageComponent: FC<{
  message: { content: string; sources?: SearchResult[] | null };
  isStreaming?: boolean;
}> = ({ message, isStreaming = false }) => {
  return (
    <div className={cn(isStreaming && "relative")}>
      <AnswerBody
        content={message.content}
        sources={message.sources}
        isStreaming={isStreaming}
      />
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
