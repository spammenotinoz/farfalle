import { MessageComponent, MessageComponentSkeleton } from "./message";
import RelatedQuestions from "./related-questions";
import { SearchResultsSkeleton, SearchResults } from "./search-results";
import { Section } from "./section";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageSection, ImageSectionSkeleton } from "./image-section";
import { ChatMessage } from "../../generated";
import { Copy, Share2, Download, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ErrorMessage({ content }: { content: string }) {
  return (
    <Alert className="bg-red-500/5 border-red-500/15 p-5">
      <AlertCircle className="h-4 w-4 stroke-red-500 stroke-2" />
      <AlertDescription className="text-base text-foreground">
        {content.split(" ").map((word, index) => {
          const urlPattern = /(https?:\/\/[^\s]+)/g;
          if (urlPattern.test(word)) {
            return (
              <a
                key={index}
                href={word}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {word}
              </a>
            );
          }
          return word + " ";
        })}
      </AlertDescription>
    </Alert>
  );
}

const ContentActions = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Search Result",
        text: content.slice(0, 200) + "...",
      });
    } else {
      await navigator.clipboard.writeText(content);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "search-result.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopy} className="gap-2">
          <Copy size={14} />
          {copied ? "Copied!" : "Copy"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="gap-2">
          <Share2 size={14} />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExport} className="gap-2">
          <Download size={14} />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const AssistantMessageContent = ({
  message,
  isStreaming = false,
  onRelatedQuestionSelect,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onRelatedQuestionSelect: (question: string) => void;
}) => {
  const {
    sources,
    content,
    related_queries,
    images,
    is_error_message = false,
  } = message;

  if (is_error_message) {
    return <ErrorMessage content={message.content} />;
  }

  const hasSources = sources && sources.length > 0;
  const hasImages = images && images.length > 0;
  const hasRelated = related_queries && related_queries.length > 0;

  return (
    <div className="flex flex-col group">
      <div className="relative">
        <Section
          title="Answer"
          animate={isStreaming}
          streaming={isStreaming}
        >
          {content ? (
            <div className="relative">
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ContentActions content={content} />
              </div>
              <MessageComponent message={message} isStreaming={isStreaming} />
            </div>
          ) : (
            <MessageComponentSkeleton />
          )}
        </Section>
      </div>

      {hasImages && (
        <Section title="Images" animate={isStreaming}>
          <ImageSection images={images} />
        </Section>
      )}

      {hasSources && (
        <Section title="Sources" animate={isStreaming}>
          <SearchResults results={sources} />
        </Section>
      )}

      {hasRelated && (
        <Section title="Related" animate={isStreaming}>
          <RelatedQuestions
            questions={related_queries}
            onSelect={onRelatedQuestionSelect}
          />
        </Section>
      )}
    </div>
  );
};
