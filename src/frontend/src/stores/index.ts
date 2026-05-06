import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { ConfigStore, createConfigSlice } from "./slices/configSlice";
import { createMessageSlice, ChatStore } from "./slices/messageSlice";
import { ChatModel, ResearchDepth } from "../../generated";

type StoreState = ChatStore & ConfigStore;

const VALID_MODELS = new Set<string>(Object.values(ChatModel));
const VALID_DEPTHS = new Set<string>(Object.values(ResearchDepth));

const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createMessageSlice(...a),
      ...createConfigSlice(...a),
    }),
    {
      name: "store",
      // Bump version whenever the persisted schema changes. The migrate fn
      // runs once per version step on stale localStorage data so users with
      // old model names (e.g. "gpt-4.1-mini") don't get a 422 from the backend.
      version: 1,
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (!VALID_MODELS.has(s.model as string)) s.model = ChatModel.FAST;
        if (!VALID_DEPTHS.has(s.researchDepth as string)) s.researchDepth = ResearchDepth.DEEP;
        return s;
      },
      partialize: (state) => ({
        model: state.model,
        researchDepth: state.researchDepth,
      }),
    },
  ),
);

// shallow prevents new object references from triggering re-renders on every store update.
export const useChatStore = () =>
  useStore((state) => ({
    messages: state.messages,
    addMessage: state.addMessage,
    setMessages: state.setMessages,
    threadId: state.threadId,
    setThreadId: state.setThreadId,
    clearMessages: state.clearMessages,
    removeLastTurn: state.removeLastTurn,
  }), shallow);

/** Raw store — use for imperative access (e.g. getState, subscribe) */
export const chatStore = useStore;

export const useConfigStore = () =>
  useStore((state) => ({
    model: state.model,
    setModel: state.setModel,
    researchDepth: state.researchDepth,
    setResearchDepth: state.setResearchDepth,
  }), shallow);
