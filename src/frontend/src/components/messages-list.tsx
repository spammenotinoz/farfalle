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

const MessagesList = ({
  messages,
  streamingMessage,
  isStreamingMessage,
  isStreamingProSearch,
  onRelatedQuestionSelect,
}: {
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  isStreamingMessage: boolean;
  isStreamingProSearch: boolean;
  onRelatedQuestionSelect: (question: string) => void;
}) => {
  const streamingProResponse = streamingMessage?.agent_response;

  const hasReportText = Boolean(streamingMessage?.content?.trim());

  return (
    <div className="flex flex-col pb-32">
      <AnimatePresence mode="popLayout">
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {message.agent_response && (
                <ProSearchRender streamingProResponse={message.agent_response} />
              )}
              <AssistantMessageContent
                message={message}
                onRelatedQuestionSelect={onRelatedQuestionSelect}
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
          />
        </motion.div>
      )}

      {streamingMessage && isStreamingProSearch && !hasReportText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md border border-tint/20 bg-tint/5 px-3 py-2 text-sm text-tint"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading sources and preparing the report...
        </motion.div>
      )}

      {/* Streaming answer */}
      {streamingMessage && isStreamingMessage && (
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
