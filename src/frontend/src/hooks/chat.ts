import { useMutation } from "@tanstack/react-query";
import {
  AgentQueryPlanStream,
  AgentReadPagesStream,
  AgentReadResultsStream,
  AgentSearchQueriesStream,
  AgentSearchStep,
  AgentSearchStepStatus,
  ChatMessage,
  ChatRequest,
  ChatResponseEvent,
  ErrorStream,
  Message,
  MessageRole,
  RelatedQueriesStream,
  SearchResultStream,
  StreamEndStream,
  StreamEvent,
  TextChunkStream,
} from "../../generated";
import {
  fetchEventSource,
  FetchEventSourceInit,
} from "@microsoft/fetch-event-source";
import { useEffect, useRef, useState } from "react";
import { useConfigStore, useChatStore } from "@/stores";
import { env } from "../env.mjs";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

// Stall thresholds — coordinated with backend RESEARCH_TIMEOUT_SECS.
// WARN_AFTER_MS: subtitle text changes to "Still working…" so the user knows
//   we're not dead. HARD_ABORT_AFTER_SILENT_MS / HARD_ABORT_AFTER_TOTAL_MS:
//   abort the SSE stream and show a retry button.
const STALL_WARN_AFTER_MS = 30_000;
const STALL_HARD_ABORT_AFTER_SILENT_MS = 90_000;
const STALL_HARD_ABORT_AFTER_TOTAL_MS = 360_000;

export type ReadingPagesState = {
  current: number;
  total: number;
  currentUrl: string | null;
  failedCount: number;
};

export type StallStatus = "ok" | "warning";

const streamChat = async ({
  request,
  signal,
  onMessage,
}: {
  request: ChatRequest;
  signal?: AbortSignal;
  onMessage?: FetchEventSourceInit["onmessage"];
}): Promise<void> => {
  return await fetchEventSource(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // keepalive omitted — Safari buffers the entire response body when keepalive
    // is set on a streaming fetch, silently breaking SSE in regular (non-private)
    // mode. AbortController handles cleanup on navigation/unmount instead.
    // Removed openWhenHidden: true — Safari aggressively throttles/closes
    // background SSE connections, causing silent stream deaths with no recovery.
    signal,
    body: JSON.stringify({ ...request }),
    onmessage: onMessage,
    // Re-throw on error so callers can catch it and surface the failure.
    // Previously was () => {}, which silently swallowed all errors on Safari.
    onerror: (err) => {
      console.error("[fetchEventSource] SSE error", err);
      throw err;
    },
  });
};

const convertToChatRequest = (query: string, history: ChatMessage[]) => {
  const newHistory: Message[] = history.map((message) => ({
    role:
      message.role === MessageRole.USER
        ? MessageRole.USER
        : MessageRole.ASSISTANT,
    content: message.content,
  }));
  return { query, history: newHistory };
};

export const useChat = () => {
  const { addMessage, messages, threadId, setThreadId, removeLastTurn } =
    useChatStore();
  const { model, researchDepth } = useConfigStore();
  // Replaces the old module-level `let stepsDetails` — each hook instance
  // gets its own ref, preventing cross-instance state corruption on Safari.
  const stepsDetailsRef = useRef<AgentSearchStep[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastEventAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const stallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [isStreamingProSearch, setIsStreamingProSearch] = useState(false);
  const [isStreamingMessage, setIsStreamingMessage] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [readingPages, setReadingPages] = useState<ReadingPagesState | null>(
    null,
  );
  const [stallStatus, setStallStatus] = useState<StallStatus>("ok");

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearInterval(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const resetStreamingState = () => {
    setStreamingMessage(null);
    setIsStreamingMessage(false);
    setIsStreamingProSearch(false);
    setIsResearching(false);
    setReadingPages(null);
    setStallStatus("ok");
    clearStallTimer();
    abortControllerRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearStallTimer();
    };
  }, []);

  const handleEvent = (eventItem: ChatResponseEvent, state: ChatMessage) => {
    switch (eventItem.event) {
      case StreamEvent.BEGIN_STREAM:
        setIsStreamingMessage(true);
        setStreamingMessage({
          ...state,
          role: MessageRole.ASSISTANT,
          content: "",
          related_queries: [],
          sources: [],
          images: [],
        });
        break;
      case StreamEvent.SEARCH_RESULTS:
        const data = eventItem.data as SearchResultStream;
        state.sources = data.results ?? [];
        state.images = data.images ?? [];
        if (typeof data.failed_count === "number" && data.failed_count > 0) {
          setReadingPages((prev) => ({
            current: prev?.current ?? 0,
            total: prev?.total ?? 0,
            currentUrl: prev?.currentUrl ?? null,
            failedCount: data.failed_count ?? 0,
          }));
        }
        break;
      case StreamEvent.TEXT_CHUNK:
        state.content += (eventItem.data as TextChunkStream).text;

        if (!state.agent_response) {
          break;
        }
        // Mark research planning complete once answer streaming begins.
        stepsDetailsRef.current = stepsDetailsRef.current.map((step) => ({
          ...step,
          status: AgentSearchStepStatus.DONE,
        }));
        state.agent_response = {
          steps_details: stepsDetailsRef.current,
        };

        break;
      case StreamEvent.RELATED_QUERIES:
        state.related_queries =
          (eventItem.data as RelatedQueriesStream).related_queries ?? [];
        break;
      case StreamEvent.STREAM_END:
        const endData = eventItem.data as StreamEndStream;
        addMessage({ ...state });
        resetStreamingState();

        // Only if the backend is using the DB
        if (endData.thread_id) {
          setThreadId(endData.thread_id);
          // Guard: window.history.pushState throws SecurityError in Safari when
          // fired from a component that has since unmounted (e.g. tab hidden
          // mid-stream). Checking document.hidden is sufficient.
          if (!document.hidden) {
            window.history.pushState({}, "", `/search/${endData.thread_id}`);
          }
        }
        return;
      case StreamEvent.AGENT_QUERY_PLAN:
        const { steps } = eventItem.data as AgentQueryPlanStream;
        stepsDetailsRef.current =
          steps?.map((step, index) => ({
            step: step,
            queries: [],
            results: [],
            status: AgentSearchStepStatus.DEFAULT,
            step_number: index,
          })) ?? [];

        if (stepsDetailsRef.current[0]) {
          stepsDetailsRef.current[0].status = AgentSearchStepStatus.CURRENT;
        }
        state.agent_response = {
          steps_details: stepsDetailsRef.current,
        };
        break;
      case StreamEvent.AGENT_SEARCH_QUERIES:
        const { queries, step_number: queryStepNumber } =
          eventItem.data as AgentSearchQueriesStream;
        const queryStepIndex = stepsDetailsRef.current.findIndex(
          (step) => step.step_number === queryStepNumber,
        );
        if (queryStepIndex === -1) break;
        stepsDetailsRef.current[queryStepIndex].queries = queries;
        stepsDetailsRef.current[queryStepIndex].status = AgentSearchStepStatus.CURRENT;
        if (queryStepIndex !== 0) {
          stepsDetailsRef.current[queryStepIndex - 1].status =
            AgentSearchStepStatus.DONE;
        }
        state.agent_response = {
          steps_details: stepsDetailsRef.current,
        };
        break;
      case StreamEvent.AGENT_READ_RESULTS:
        const { results, step_number: resultsStepNumber } =
          eventItem.data as AgentReadResultsStream;
        const resultsStepIndex = stepsDetailsRef.current.findIndex(
          (step) => step.step_number === resultsStepNumber,
        );
        if (resultsStepIndex !== -1) {
          stepsDetailsRef.current[resultsStepIndex].results = results;
        }

        break;
      case StreamEvent.AGENT_READ_PAGES:
        const readPages = eventItem.data as AgentReadPagesStream;
        setReadingPages({
          current: readPages.current,
          total: readPages.total,
          currentUrl: readPages.current_url ?? null,
          failedCount: readPages.failed_count ?? 0,
        });
        break;
      case StreamEvent.AGENT_FINISH:
        if (stepsDetailsRef.current.length > 0) {
          const finalStepIndex = stepsDetailsRef.current.length - 1;
          stepsDetailsRef.current = stepsDetailsRef.current.map((step, index) => ({
            ...step,
            status:
              index === finalStepIndex
                ? AgentSearchStepStatus.CURRENT
                : AgentSearchStepStatus.DONE,
          }));
          state.agent_response = {
            steps_details: stepsDetailsRef.current,
          };
        }
        break;
      case StreamEvent.ERROR:
        const errorData = eventItem.data as ErrorStream;
        addMessage({
          role: MessageRole.ASSISTANT,
          content: errorData.detail,
          related_queries: [],
          sources: [],
          images: [],
          agent_response: state.agent_response,
          is_error_message: true,
        });
        resetStreamingState();
        return;
    }
    setStreamingMessage({
      role: MessageRole.ASSISTANT,
      content: state.content,
      related_queries: state.related_queries,
      sources: state.sources,
      images: state.images,
      agent_response:
        state.agent_response !== null
          ? {
              steps: stepsDetailsRef.current.map((step) => step.step),
              steps_details: stepsDetailsRef.current,
            }
          : null,
    });
  };

  const { mutateAsync: chat } = useMutation<void, Error, ChatRequest>({
    retry: false,
    mutationFn: async (request) => {
      const state: ChatMessage = {
        role: MessageRole.ASSISTANT,
        content: "",
        sources: [],
        related_queries: [],
        images: [],
        agent_response: null,
      };
      addMessage({ role: MessageRole.USER, content: request.query });
      stepsDetailsRef.current = [];
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      startedAtRef.current = Date.now();
      lastEventAtRef.current = Date.now();
      setStallStatus("ok");
      setIsResearching(true);

      // Watchdog: abort if the stream goes silent or runs too long.
      // Refs are checked instead of state so updates aren't lost across renders.
      clearStallTimer();
      stallTimerRef.current = setInterval(() => {
        const now = Date.now();
        const sinceLastEvent = now - lastEventAtRef.current;
        const sinceStart = now - startedAtRef.current;
        if (
          sinceLastEvent > STALL_HARD_ABORT_AFTER_SILENT_MS ||
          sinceStart > STALL_HARD_ABORT_AFTER_TOTAL_MS
        ) {
          abortController.abort();
        } else if (sinceLastEvent > STALL_WARN_AFTER_MS) {
          setStallStatus("warning");
        }
      }, 1000);

      const req: ChatRequest = {
        ...request,
        thread_id: threadId,
        model,
        pro_search: true,
        research_depth: researchDepth,
      };
      setIsStreamingProSearch(true);
      try {
        await streamChat({
          request: req,
          signal: abortController.signal,
          onMessage: (event) => {
            // Reset stall watchdog on every byte from the server (including
            // SSE keep-alive comments that arrive with empty data). Always
            // calling setStallStatus is fine — React bails out when the
            // value is unchanged.
            lastEventAtRef.current = Date.now();
            setStallStatus("ok");

            // Handles keep-alive events
            if (!event.data) return;

            const eventItem: ChatResponseEvent = JSON.parse(event.data);
            handleEvent(eventItem, state);
          },
        });
      } catch (error) {
        if (abortController.signal.aborted) return;
        // Network/CORS/extension-blocked errors — show a recoverable error
        // instead of re-throwing. A re-throw propagates through mutateAsync to
        // the event handler with no catch, becoming an unhandled rejection that
        // crashes the React component tree (blank page) in React 18 / Safari.
        console.error("[chat] SSE stream failed", error);
        addMessage({
          role: MessageRole.ASSISTANT,
          content:
            "Could not connect to the research service. Check your connection and try again.",
          related_queries: [],
          sources: state.sources,
          images: state.images,
          agent_response: state.agent_response,
          is_error_message: true,
        });
        return;
      } finally {
        clearStallTimer();
        if (abortController.signal.aborted) {
          const sinceStart = Date.now() - startedAtRef.current;
          const stalled =
            sinceStart > STALL_HARD_ABORT_AFTER_TOTAL_MS - 1000 ||
            Date.now() - lastEventAtRef.current >
              STALL_HARD_ABORT_AFTER_SILENT_MS - 1000;
          const partialContent = state.content.trim();
          if (stalled) {
            addMessage({
              role: MessageRole.ASSISTANT,
              content: partialContent
                ? `${partialContent}\n\nResearch stalled and was cancelled. Try again or pick a shorter depth.`
                : "Research stalled. Try again or pick a shorter depth.",
              related_queries: [],
              sources: state.sources,
              images: state.images,
              agent_response: state.agent_response,
              is_error_message: true,
            });
          } else {
            addMessage({
              role: MessageRole.ASSISTANT,
              content: partialContent
                ? `${partialContent}\n\nResearch stopped before the final report was completed.`
                : "Research stopped before the final report was completed.",
              related_queries: [],
              sources: state.sources,
              images: state.images,
              agent_response: state.agent_response,
            });
          }
        }
        if (abortControllerRef.current === abortController) {
          resetStreamingState();
        }
      }
    },
  });

  const handleSend = async (query: string) => {
    try {
      await chat(convertToChatRequest(query, messages));
    } catch (err) {
      // mutationFn handles errors internally; this catch guards against any
      // edge case where mutateAsync still throws (e.g. React Query internals).
      console.error("[handleSend] unhandled error", err);
    }
  };

  // Pop the failed turn, drop any thread association (stale after a failure),
  // and re-send the original query as a fresh research request.
  const retryLast = async () => {
    const query = removeLastTurn();
    if (!query) return;
    setThreadId(null);
    await handleSend(query);
  };

  const stopResearch = () => {
    abortControllerRef.current?.abort();
  };

  return {
    handleSend,
    retryLast,
    stopResearch,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
    isResearching,
    readingPages,
    stallStatus,
  };
};
