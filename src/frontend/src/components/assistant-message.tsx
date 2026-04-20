import { MessageComponent, MessageComponentSkeleton } from "./message";
import RelatedQuestions from "./related-questions";
import { SearchResults } from "./search-results";
import { AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageSection } from "./image-section";
import { ChatMessage } from "../../generated";
import { Copy, Share2, Download, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

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
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
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

// ─── Inline Sources (for mobile / fallback) ───────────────────────────────
const InlineSources = ({ sources }: { sources: ChatMessage["sources"] }) => {
  if (!sources?.length) return null;

  return (
    <details className="group mt-4 border rounded-xl overflow-hidden">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground transition-colors">
        <BookOpen size={14} className="text-tint flex-shrink-0" />
        <span className="font-medium">Sources</span>
        <span className="text-xs text-muted-foreground font-mono ml-1">
          ({sources.length})
        </span>
        <svg
          className="ml-auto transition-transform group-open:rotate-180"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t px-4 py-3">
        <SearchResults results={sources} />
      </div>
    </details>
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
    <div className="animate-message-in">
      {/* Answer */}
      <div className="mb-2">
        {content ? (
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <MessageComponent message={message} isStreaming={isStreaming} />
            </div>
            <div className="flex-shrink-0">
              <ContentActions content={content} />
            </div>
          </div>
        ) : (
          <MessageComponentSkeleton />
        )}
      </div>

      {/* Images (mobile-friendly inline) */}
      {hasImages && (
        <div className="mt-4">
          <ImageSection images={images} />
        </div>
      )}

      {/* Inline sources — only shown on small screens where sidebar isn't available */}
      {hasSources && (
        <div className="md:hidden mt-4">
          <InlineSources sources={sources} />
        </div>
      )}

      {/* Related questions */}
      {hasRelated && (
        <div className="mt-6">
          <RelatedQuestions
            questions={related_queries}
            onSelect={onRelatedQuestionSelect}
          />
        </div>
      )}
    </div>
  );
};
