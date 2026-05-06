import { MessageComponent, MessageComponentSkeleton } from "./message";
import RelatedQuestions from "./related-questions";
import { SearchResults } from "./search-results";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageSection } from "./image-section";
import { ChatMessage } from "../../generated";
import { Copy, Share2, Download, MoreHorizontal, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

// ─── Inline Sources (mobile fallback) ──────────────────────────────────
const InlineSources = ({ sources }: { sources: ChatMessage["sources"] }) => {
  if (!sources?.length) return null;
  return (
    <details className="group border rounded-md overflow-hidden mt-5">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground transition-colors">
        <BookOpen size={14} className="text-tint flex-shrink-0" />
        <span className="font-medium">Sources</span>
        <span className="text-xs text-muted-foreground font-mono ml-1">({sources.length})</span>
        <svg className="ml-auto transition-transform group-open:rotate-180" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="border-t px-4 py-3">
        <SearchResults results={sources} />
      </div>
    </details>
  );
};

// ─── URL Detection Regex ──────────────────────────────────────────────
// Declared at module scope to avoid the g-flag lastIndex state bug.
// ───────────────────────────────────────────────────────────────────────
const URL_REGEX = /(https?:\/\/[^\s]+)/;

// ─── Error Message ───────────────────────────────────────────────────────
export function ErrorMessage({
  content,
  onRetry,
}: {
  content: string;
  onRetry?: () => void;
}) {
  const words = content.split(" ");
  const retryRef = useRef<HTMLButtonElement | null>(null);

  // Move focus to retry on mount so keyboard users can recover with Enter.
  useEffect(() => {
    if (onRetry) retryRef.current?.focus();
  }, [onRetry]);

  return (
    <Alert
      className="bg-destructive/5 border-destructive/15 p-5 rounded-md"
      role="alert"
    >
      <AlertDescription className="text-sm text-foreground leading-relaxed">
        {words.map((word, index) => {
          URL_REGEX.lastIndex = 0; // reset before every test call
          if (URL_REGEX.test(word)) {
            return (
              <a key={index} href={word} target="_blank" rel="noopener noreferrer" className="underline text-tint">
                {word}
              </a>
            );
          }
          return word + " ";
        })}
      </AlertDescription>
      {onRetry && (
        <div className="mt-3">
          <Button
            ref={retryRef}
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="gap-1.5"
            data-testid="retry-button"
          >
            <RotateCcw size={14} />
            Try again
          </Button>
        </div>
      )}
    </Alert>
  );
}

// ─── Content Actions ────────────────────────────────────────────────────
const ContentActions = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Search Result", text: content.slice(0, 200) + "..." });
    } else {
      await navigator.clipboard.writeText(content);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "research-report.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0 rounded-md">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopy} className="gap-2 text-sm">
          <Copy size={14} />{copied ? "Copied!" : "Copy answer"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="gap-2 text-sm">
          <Share2 size={14} />Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExport} className="gap-2 text-sm">
          <Download size={14} />Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Answer Meta Bar ────────────────────────────────────────────────────
const AnswerMetaBar = ({
  sources,
  isStreaming,
}: {
  sources: ChatMessage["sources"];
  isStreaming: boolean;
}) => {
  if (!sources?.length) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <BookOpen size={12} className="text-tint" />
        <span>{sources.length} sources in sidebar</span>
      </span>
      {isStreaming && (
        <span className="flex items-center gap-1.5 text-tint">
          <Loader2 size={12} className="animate-spin" />
          <span>Report still generating</span>
        </span>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────
export const AssistantMessageContent = ({
  message,
  isStreaming = false,
  onRelatedQuestionSelect,
  onRetry,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onRelatedQuestionSelect: (question: string) => void;
  onRetry?: () => void;
}) => {
  const { sources, content, related_queries, images, is_error_message = false } = message;

  if (is_error_message) {
    return <ErrorMessage content={message.content} onRetry={onRetry} />;
  }

  const hasSources = sources && sources.length > 0;
  const hasImages = images && images.length > 0;
  const hasRelated = related_queries && related_queries.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="research-answer"
    >
      {/* Answer card */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {isStreaming ? (
            <Loader2 size={15} className="animate-spin text-tint" />
          ) : (
            <FileText size={15} className="text-tint" />
          )}
          Research report
          {isStreaming && (
            <span className="rounded bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-tint">
              Generating
            </span>
          )}
        </div>
        {!isStreaming && content && <ContentActions content={content} />}
      </div>

      <div
        className="answer-card mb-4"
        aria-live="polite"
        aria-busy={isStreaming}
        data-testid="research-answer"
      >
        {/* Meta bar */}
        <AnswerMetaBar sources={sources} isStreaming={isStreaming} />

        {/* Answer content */}
        {content ? (
          <div className="min-w-0">
            <MessageComponent message={message} isStreaming={isStreaming} />
          </div>
        ) : (
          <MessageComponentSkeleton />
        )}
      </div>

      {/* Images */}
      {hasImages && (
        <div className="mt-3">
          <ImageSection images={images} />
        </div>
      )}

      {/* Inline sources — mobile only */}
      {hasSources && (
        <div className="md:hidden">
          <InlineSources sources={sources} />
        </div>
      )}

      {/* Related questions */}
      {hasRelated && (
        <div className="mt-4">
          <RelatedQuestions questions={related_queries} onSelect={onRelatedQuestionSelect} />
        </div>
      )}
    </motion.div>
  );
};
