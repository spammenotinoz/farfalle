"use client";

import { useChat } from "@/hooks/chat";
import { useChatStore } from "@/stores";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskInput } from "./ask-input";

import { useChatThread } from "@/hooks/threads";
import { LoaderIcon } from "lucide-react";
import type { MessageRole, SearchResult } from "../../generated";
import { MessageRole as MR } from "../../generated";
import MessagesList from "./messages-list";
import { StarterQuestionsList } from "./starter-questions";
import { SourcesSidebar } from "./sources-sidebar";
import { createPortal } from "react-dom";
import { PanelRightOpen, X } from "lucide-react";

const useAutoScroll = (ref: React.RefObject<HTMLDivElement>) => {
  const { messages } = useChatStore();

  useEffect(() => {
    if (messages.at(-1)?.role === MR.USER) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      if (ref.current) setWidth(ref.current.scrollWidth);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [messages, ref, setWidth]);
};

const useAutoFocus = (ref: React.RefObject<HTMLTextAreaElement>) => {
  useEffect(() => ref.current?.focus(), [ref]);
};

// Extract the latest assistant message's sources for the sidebar
function useLatestSources(): SearchResult[] {
  const { messages } = useChatStore();
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === MR.ASSISTANT && msg.sources?.length) {
      return msg.sources;
    }
  }
  return [];
}

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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const latestSources = useLatestSources();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useAutoScroll(messageBottomRef);
  useAutoResizeInput(messagesRef, setWidth);
  useAutoFocus(inputRef);

  useEffect(() => {
    if (queryMessage && !hasRun.current) {
      hasRun.current = true;
      setThreadId(null);
      handleSend(queryMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMessage]);

  useEffect(() => {
    if (!thread) return;
    setThreadId(thread.thread_id);
    setMessages(thread.messages || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, thread]);

  useEffect(() => {
    if (messages.length === 0) setThreadId(null);
  }, [messages, setThreadId]);

  const showSidebar = latestSources.length > 0;
  const sidebarPortalId = threadId ? "sources-sidebar-search" : "sources-sidebar";

  if (messages.length === 0 && !threadId) {
    return (
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
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="animate-spin w-8 h-8 text-tint" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-destructive">Failed to load conversation</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
          style={{ width: `${width}px`, margin: "0 auto", maxWidth: "calc(100vw - 2rem)" }}
        >
          <div className="max-w-2xl mx-auto">
            <AskInput isFollowingUp sendMessage={handleSend} />
          </div>
        </div>
      </div>

      {/* Tablet: floating toggle to open mobile sidebar */}
      {showSidebar && (
        <button
          className="sidebar-toggle hidden max-[1200px]:flex"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Hide sources" : "Show sources"}
        >
          {sidebarOpen ? <X size={14} /> : <PanelRightOpen size={14} />}
        </button>
      )}

      {/* Mobile sidebar: slide-in panel over content */}
      {showSidebar && sidebarOpen && mounted && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-30 hidden max-[1200px]:block"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed right-0 top-16 bottom-0 w-80 bg-background border-l z-40 p-4 overflow-y-auto shadow-2xl hidden max-[1200px]:block"
            style={{ animation: "slide-in-right 0.25s ease-out" }}
          >
            <SourcesSidebar results={latestSources} />
          </div>
        </>
      )}

      {/* Desktop sidebar via portal */}
      {showSidebar && mounted && (
        createPortal(
          <SourcesSidebar results={latestSources} />,
          document.getElementById(sidebarPortalId) ?? document.body,
        )
      )}
    </>
  );
};
