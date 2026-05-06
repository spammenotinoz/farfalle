"use client";

import { useChat } from "@/hooks/chat";
import { useChatStore } from "@/stores";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskInput } from "./ask-input";

import { useChatThread } from "@/hooks/threads";
import { BookOpen, LoaderIcon } from "lucide-react";
import type { SearchResult } from "../../generated";
import { MessageRole as MR } from "../../generated";
import MessagesList from "./messages-list";
import { StarterQuestionsList } from "./starter-questions";
import { SourcesSidebar } from "./sources-sidebar";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const useAutoScroll = (ref: React.RefObject<HTMLDivElement>) => {
  const { messages } = useChatStore();
  useEffect(() => {
    if (messages.at(-1)?.role === MR.USER) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, ref]);
};

const useAutoFocus = (ref: React.RefObject<HTMLTextAreaElement>) => {
  useEffect(() => ref.current?.focus(), [ref]);
};

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
    retryLast,
    stopResearch,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
    isResearching,
    readingPages,
    stallStatus,
  } = useChat();
  const { messages, setMessages, setThreadId } = useChatStore();
  const { data: thread, isLoading, error } = useChatThread(threadId);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const messageBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const savedSources = useLatestSources();
  const latestSources = streamingMessage?.sources?.length
    ? streamingMessage.sources
    : savedSources;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useAutoScroll(messageBottomRef);
  useAutoFocus(inputRef);

  useEffect(() => {
    if (queryMessage && !hasRun.current) {
      hasRun.current = true;
      setThreadId(null);
      handleSend(queryMessage);
    }
  }, [queryMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!thread) return;
    setThreadId(thread.thread_id);
    // Only replace messages from the API when the store is empty — the SSE
    // stream already has the complete, rich state (including agent_response).
    // Overwriting with API data would erase that and cause a visible flash.
    if (messages.length === 0) {
      setMessages(thread.messages || []);
    }
  }, [threadId, thread]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length === 0) setThreadId(null);
  }, [messages, setThreadId]);

  const showSidebar = latestSources.length > 0;
  const sidebarPortalId = threadId ? "sources-sidebar-search" : "sources-sidebar";

  // ─── Empty state: homepage ─────────────────────────────────────────────
  if (messages.length === 0 && !threadId) {
    return (
      <div className="flex w-full flex-col px-4 py-16 sm:py-20">
        <div className="mb-8 animate-fade-in">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Deep research, with sources you can inspect.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Ask a question and get a structured brief with an evidence matrix,
            source tension, research gaps, and citations tied back to live web results.
          </p>
        </div>

        <div className="mb-10 w-full max-w-3xl animate-slide-up" style={{ animationDelay: "80ms" }}>
          <AskInput
            sendMessage={handleSend}
            onStop={stopResearch}
            isResearching={isResearching}
          />
        </div>

        <div className="w-full max-w-4xl animate-slide-up" style={{ animationDelay: "160ms" }}>
          <StarterQuestionsList handleSend={handleSend} />
        </div>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────
  // Skip the loading screen if messages are already in the store — this
  // happens when the SSE stream completes and pushState navigates to
  // /search/[slug], causing Next.js to remount ChatPanel. The store already
  // has the full conversation; showing a spinner here would blank the screen.
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32">
        <LoaderIcon className="animate-spin w-7 h-7 text-tint mb-3" />
        <p className="text-sm text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 text-center">
        <p className="text-destructive text-sm font-medium mb-1">Failed to load</p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // ─── Main conversation view ────────────────────────────────────────────
  return (
    <>
      <div ref={messagesRef} className="conversation-active pt-6 pb-36 w-full relative">
        <MessagesList
          messages={messages}
          streamingMessage={streamingMessage}
          isStreamingMessage={isStreamingMessage}
          isStreamingProSearch={isStreamingProSearch}
          isResearching={isResearching}
          readingPages={readingPages}
          stallStatus={stallStatus}
          onRelatedQuestionSelect={handleSend}
          onRetryLast={retryLast}
        />
        <div ref={messageBottomRef} className="h-0" />

        {/* Fixed bottom input — input-bar-sidebar shifts right at ≥1100px to clear the sources sidebar */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 px-4 sm:px-6 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-4",
            showSidebar && "input-bar-sidebar",
          )}
        >
          <div className="max-w-3xl mx-auto">
            <AskInput
              isFollowingUp
              sendMessage={handleSend}
              onStop={stopResearch}
              isResearching={isResearching}
            />
          </div>
        </div>
      </div>

      {/* Tablet: floating sidebar toggle */}
      {showSidebar && (
        <button
          className="sidebar-toggle hidden max-[1100px]:flex"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Hide sources" : "Show sources"}
        >
          {sidebarOpen ? (
            <X size={14} />
          ) : (
            <>
              <BookOpen size={14} />
              <span className="writing-mode-vertical hidden text-[11px] font-medium sm:inline">
                Sources
              </span>
            </>
          )}
        </button>
      )}

      {/* Mobile sidebar: slide-in */}
      {showSidebar && sidebarOpen && mounted && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-30 hidden max-[1100px]:block"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed right-0 top-16 bottom-0 w-80 bg-background border-l z-40 p-4 overflow-y-auto shadow-2xl hidden max-[1100px]:block"
            style={{ animation: "slide-in-right 0.2s ease-out" }}
          >
            <SourcesSidebar results={latestSources} isLive={isResearching} />
          </div>
        </>
      )}

      {/* Desktop sidebar via portal */}
      {showSidebar && mounted && (
        createPortal(
          <SourcesSidebar results={latestSources} isLive={isResearching} />,
          document.getElementById(sidebarPortalId) ?? document.body,
        )
      )}
    </>
  );
};
