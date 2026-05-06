import { AssistantMessageContent } from "./assistant-message";
import { Separator } from "@/components/ui/separator";
import { UserMessageContent } from "./user-message";
import { memo } from "react";
import {
  ChatMessage,
  MessageRole,
} from "../../generated";
import { ProSearchRender } from "./pro-search-render";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReadingPagesState, StallStatus } from "@/hooks/chat";

interface MessagesListProps {
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  isStreamingMessage: boolean;
  isStreamingProSearch: boolean;
  isResearching: boolean;
  readingPages?: ReadingPagesState | null;
  stallStatus?: StallStatus;
  onRelatedQuestionSelect: (question: string) => void;
  onRetryLast?: () => void;
}

const MessagesList = ({
  messages,
  streamingMessage,
  isStreamingMessage,
  isStreamingProSearch,
  isResearching,
  readingPages = null,
  stallStatus = "ok",
  onRelatedQuestionSelect,
  onRetryLast,
}: MessagesListProps) => {
  const streamingProResponse = streamingMessage?.agent_response;

  const hasReportText = Boolean(streamingMessage?.content?.trim());
  const finalStepStarted = Boolean(
    streamingProResponse?.steps_details?.at(-1)?.status !== "default",
  );

  // True immediately when the user hits send (before first SSE event arrives).
  // Shows a skeleton so the user knows something is happening.
  const isWaitingForFirstEvent =
    isResearching && !isStreamingMessage && messages.length > 0;

  return (
    <div className="flex flex-col pb-32">
      {/*
        Default mode (sync) — not popLayout. popLayout pulls the entering
        assistant message into the same "pop" cycle when the streaming UI
        sections unmount in the same commit (after STREAM_END), causing the
        report and progress card to vanish instantly after generation. With
        sync mode the new entry mounts normally while siblings shift.
      */}
      <AnimatePresence initial={false}>
        {messages.map((message, index) =>
          message.role === MessageRole.USER ? (
            <motion.div
              key={`user-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="animate-message-in"
            >
              <UserMessageContent message={message} />
            </motion.div>
          ) : (
            <motion.div
              key={`assistant-${index}`}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {message.agent_response && (
                <ProSearchRender
                  streamingProResponse={message.agent_response}
                  reportStarted={Boolean(message.content?.trim())}
                />
              )}
              <AssistantMessageContent
                message={message}
                onRelatedQuestionSelect={onRelatedQuestionSelect}
                onRetry={
                  message.is_error_message &&
                  index === messages.length - 1 &&
                  !isResearching
                    ? onRetryLast
                    : undefined
                }
              />
              {index !== messages.length - 1 && (
                <Separator className="my-8 opacity-30" />
              )}
            </motion.div>
          ),
        )}
      </AnimatePresence>

      {/* Live research steps while streaming */}
      {isStreamingProSearch && streamingProResponse && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
        >
          <ProSearchRender
            streamingProResponse={streamingProResponse}
            isStreamingProSearch={isStreamingProSearch}
            reportStarted={hasReportText}
            readingPages={readingPages}
            stallStatus={stallStatus}
          />
        </motion.div>
      )}

      {streamingMessage && isStreamingProSearch && !hasReportText && !finalStepStarted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md border border-tint/20 bg-tint/5 px-3 py-2 text-sm text-tint"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading sources and preparing the report...
        </motion.div>
      )}

      {streamingMessage && isStreamingMessage && finalStepStarted && !hasReportText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting report generation...
        </motion.div>
      )}

      {streamingMessage && isStreamingMessage && hasReportText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating report...
        </motion.div>
      )}

      {/* Show skeleton immediately after user submits, before first SSE event */}
      {isWaitingForFirstEvent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md border border-tint/20 bg-tint/5 px-3 py-2 text-sm text-tint"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting research…
        </motion.div>
      )}

      {/* Streaming answer */}
      {streamingMessage && isStreamingMessage && hasReportText && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <AssistantMessageContent
            message={streamingMessage}
            isStreaming={true}
            onRelatedQuestionSelect={onRelatedQuestionSelect}
          />
        </motion.div>
      )}
    </div>
  );
};

export default memo(MessagesList);
