import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { ConfigStore, createConfigSlice } from "./slices/configSlice";
import { createMessageSlice, ChatStore } from "./slices/messageSlice";

type StoreState = ChatStore & ConfigStore;

const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createMessageSlice(...a),
      ...createConfigSlice(...a),
    }),
    {
      name: "store",
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
