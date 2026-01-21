"use client";

import { useChat } from "@/hooks/chat";
import { useChatStore } from "@/stores";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskInput } from "./ask-input";

import { useChatThread } from "@/hooks/threads";
import { LoaderIcon } from "lucide-react";
import { MessageRole } from "../../generated";
import MessagesList from "./messages-list";
import { StarterQuestionsList } from "./starter-questions";

const useAutoScroll = (ref: React.RefObject<HTMLDivElement>) => {
  const { messages } = useChatStore();

  useEffect(() => {
    if (messages.at(-1)?.role === MessageRole.USER) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, ref]);
};

const useAutoResizeInput = (
  ref: React.RefObject<HTMLDivElement>,
  setWidth: (width: number) => void,
) => {
  const { messages } = useChatStore();

  useEffect(() => {
    const updatePosition = () => {
      if (ref.current) {
        setWidth(ref.current.scrollWidth);
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [messages, ref, setWidth]);
};

const useAutoFocus = (ref: React.RefObject<HTMLTextAreaElement>) => {
  useEffect(() => {
    ref.current?.focus();
  }, [ref]);
};

export const ChatPanel = ({ threadId }: { threadId?: number }) => {
  const searchParams = useSearchParams();
  const queryMessage = searchParams.get("q");
  const hasRun = useRef(false);

  const {
    handleSend,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
  } = useChat();
  const { messages, setMessages, setThreadId } = useChatStore();
  const { data: thread, isLoading, error } = useChatThread(threadId);

  const [width, setWidth] = useState(0);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const messageBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useAutoScroll(messageBottomRef);
  useAutoResizeInput(messagesRef, setWidth);
  useAutoFocus(inputRef);

  useEffect(() => {
    if (queryMessage && !hasRun.current) {
      setThreadId(null);
      hasRun.current = true;
      handleSend(queryMessage);
    }
  }, [queryMessage]);

  useEffect(() => {
    if (!thread) return;
    setThreadId(thread.thread_id);
    setMessages(thread.messages || []);
  }, [threadId, thread, setMessages, setThreadId]);

  useEffect(() => {
    if (messages.length == 0) {
      setThreadId(null);
    }
  }, [messages, setThreadId]);

  return (
    <>
      {messages.length > 0 || threadId ? (
        isLoading ? (
          <div className="w-full flex justify-center items-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <LoaderIcon className="animate-spin w-8 h-8 text-tint" />
              <p className="text-sm text-muted-foreground">Loading conversation...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full flex justify-center items-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-destructive">Failed to load conversation</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : (
          <div ref={messagesRef} className="pt-4 pb-40 w-full relative">
            <MessagesList
              messages={messages}
              streamingMessage={streamingMessage}
              isStreamingMessage={isStreamingMessage}
              isStreamingProSearch={isStreamingProSearch}
              onRelatedQuestionSelect={handleSend}
            />
            <div ref={messageBottomRef} className="h-0" />
            <div
              className="fixed bottom-0 left-0 right-0 px-4 md:px-8 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4"
              style={{ width: `${width}px`, margin: '0 auto', maxWidth: 'calc(100vw - 2rem)' }}
            >
              <div className="max-w-screen-md mx-auto">
                <AskInput isFollowingUp sendMessage={handleSend} />
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="w-full flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
          <div className="flex flex-col items-center justify-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-tint to-tint/60 bg-clip-text text-transparent">
              Ask anything
            </h1>
            <p className="text-muted-foreground text-center max-w-md">
              Search the web, get answers, and chat with an AI that knows the world.
            </p>
          </div>
          <div className="w-full max-w-lg">
            <AskInput sendMessage={handleSend} />
            <div className="mt-6">
              <StarterQuestionsList handleSend={handleSend} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded-md font-mono">Ctrl</kbd>
              <kbd className="px-2 py-1 bg-muted rounded-md font-mono">Enter</kbd>
              to search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded-md font-mono">?</kbd>
              for shortcuts
            </span>
          </div>
        </div>
      )}
    </>
  );
};
