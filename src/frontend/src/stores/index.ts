import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useChatStore = () =>
  useStore((state) => ({
    messages: state.messages,
    addMessage: state.addMessage,
    setMessages: state.setMessages,
    threadId: state.threadId,
    setThreadId: state.setThreadId,
    clearMessages: state.clearMessages,
  }));

/** Raw store — use for imperative access (e.g. getState, subscribe) */
export const chatStore = useStore;

export const useConfigStore = () =>
  useStore((state) => ({
    model: state.model,
    setModel: state.setModel,
    researchDepth: state.researchDepth,
    setResearchDepth: state.setResearchDepth,
  }));
