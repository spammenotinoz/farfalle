import { AssistantMessageContent } from "./assistant-message";
import { Separator } from "./ui/separator";
import { UserMessageContent } from "./user-message";
import { memo } from "react";
import {
  AgentSearchFullResponse,
  ChatMessage,
  MessageRole,
} from "../../generated";
import { ProSearchRender } from "./pro-search-render";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <div className="flex flex-col pb-28">
      <AnimatePresence>
        {messages.map((message, index) =>
          message.role === MessageRole.USER ? (
            <motion.div
              key={`user-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UserMessageContent message={message} />
            </motion.div>
          ) : (
            <motion.div
              key={`assistant-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {message.agent_response && (
                <ProSearchRender streamingProResponse={message.agent_response} />
              )}
              <AssistantMessageContent
                message={message}
                onRelatedQuestionSelect={onRelatedQuestionSelect}
              />
              {index !== messages.length - 1 && (
                <Separator className="my-8 opacity-50" />
              )}
            </motion.div>
          ),
        )}
      </AnimatePresence>

      {isStreamingProSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <ProSearchRender
            streamingProResponse={streamingProResponse ?? null}
            isStreamingProSearch={isStreamingProSearch}
          />
        </motion.div>
      )}

      {streamingMessage && isStreamingMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
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
