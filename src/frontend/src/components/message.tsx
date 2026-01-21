import React, { FC, memo, useEffect, useState, useMemo } from "react";
import { MemoizedReactMarkdown } from "./markdown";
import rehypeRaw from "rehype-raw";

import _ from "lodash";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { ChatMessage, SearchResult } from "../../generated";

function chunkString(str: string): string[] {
  const words = str.split(" ");
  const chunks = _.chunk(words, 2).map((chunk) => chunk.join(" ") + " ");
  return chunks;
}

export interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

// Citation component that properly renders links
const CitationLink = ({
  number,
  url,
  title,
}: {
  number: number;
  url: string;
  title?: string;
}) => {
  if (!url) {
    return (
      <sup className="inline-flex items-center justify-center mx-0.5">
        <span className="h-[1rem] min-w-[1rem] items-center justify-center rounded-full text-center px-1.5 text-xs font-mono bg-muted text-muted-foreground select-none">
          {number}
        </span>
      </sup>
    );
  }

  return (
    <sup className="inline-flex items-center justify-center mx-0.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
        title={title || url}
      >
        <span className="h-[1rem] min-w-[1rem] items-center justify-center rounded-full text-center px-1.5 text-xs font-mono bg-muted text-muted-foreground hover:bg-muted/80">
          {number}
        </span>
      </a>
    </sup>
  );
};

const Text = ({
  children,
  isStreaming,
  containerElement = "p",
}: {
  children: React.ReactNode;
  isStreaming: boolean;
  containerElement: React.ElementType;
}) => {
  const renderText = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const chunks = isStreaming ? chunkString(node) : [node];
      return chunks.flatMap((chunk, index) => {
        return (
          <span
            key={`${index}-streaming`}
            className={cn(
              isStreaming ? "animate-in fade-in-25 duration-700" : "",
            )}
          >
            {chunk}
          </span>
        );
      });
    } else if (React.isValidElement(node)) {
      return React.cloneElement(
        node,
        node.props,
        renderText(node.props.children),
      );
    } else if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{renderText(child)}</React.Fragment>
      ));
    }
    return null;
  };

  const text = renderText(children);
  return React.createElement(containerElement, {}, text);
};

const StreamingParagraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={true} containerElement="p">
        {children}
      </Text>
    );
  },
);
const Paragraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={false} containerElement="p">
        {children}
      </Text>
    );
  },
);

const ListItem = memo(({ children }: React.HTMLProps<HTMLLIElement>) => {
  return (
    <Text isStreaming={false} containerElement="li">
      {children}
    </Text>
  );
});

const StreamingListItem = memo(
  ({ children }: React.HTMLProps<HTMLLIElement>) => {
    return (
      <Text isStreaming={true} containerElement="li">
        {children}
      </Text>
    );
  },
);

StreamingParagraph.displayName = "StreamingParagraph";
Paragraph.displayName = "Paragraph";
ListItem.displayName = "ListItem";
StreamingListItem.displayName = "StreamingListItem";

// Process content to replace [1], [2], etc. with citation components
const processContentWithCitations = (
  content: string,
  sources: SearchResult[] | null | undefined,
): React.ReactNode => {
  const citationRegex = /\[(\d+)\]/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(content)) !== null) {
    // Add text before the citation
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push(
        <Text key={`text-${lastIndex}`} isStreaming={false} containerElement="span">
          {textBefore}
        </Text>,
      );
    }

    // Parse citation number
    const number = parseInt(match[1], 10);
    const source = sources?.[number - 1];

    elements.push(
      <CitationLink
        key={`citation-${number}-${lastIndex}`}
        number={number}
        url={source?.url ?? ""}
        title={source?.title}
      />,
    );

    lastIndex = citationRegex.lastIndex;
  }

  // Add remaining text
  const remainingText = content.slice(lastIndex);
  if (remainingText) {
    elements.push(
      <Text key={`text-${lastIndex}`} isStreaming={false} containerElement="span">
        {remainingText}
      </Text>,
    );
  }

  return elements;
};

export const MessageComponent: FC<MessageProps> = ({
  message,
  isStreaming = false,
}) => {
  const { content, sources } = message;

  const processedContent = useMemo(
    () => processContentWithCitations(content, sources),
    [content, sources],
  );

  return (
    <div className="leading-relaxed break-words">
      {processedContent}
    </div>
  );
};

export const MessageComponentSkeleton = () => {
  return (
    <>
      <Skeleton className="w-full py-4 bg-card">
        <div className="flex flex-col gap-4">
          <Skeleton className="mx-5 h-2 bg-primary/30" />
          <Skeleton className="mx-5 h-2 bg-primary/30 mr-20" />
          <Skeleton className="mx-5 h-2 bg-primary/30 mr-40" />
        </div>
      </Skeleton>
    </>
  );
};
