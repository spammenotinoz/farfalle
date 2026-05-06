import { create, StateCreator } from "zustand";
import { ChatMessage } from "../../../generated";

type State = {
  threadId: number | null;
  messages: ChatMessage[];
};

type Actions = {
  addMessage: (message: ChatMessage) => void;
  setThreadId: (threadId: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  removeLastTurn: () => string | null;
};

export type ChatStore = State & Actions;

export const createMessageSlice: StateCreator<ChatStore, [], [], ChatStore> = (
  set,
  get,
) => ({
  threadId: null,
  messages: [],
  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setThreadId: (threadId: number | null) => set((state) => ({ threadId })),
  setMessages: (messages: ChatMessage[]) => set((state) => ({ messages })),
  clearMessages: () => set((state) => ({ messages: [], threadId: null })),
  // Pops the trailing assistant message + the preceding user message and
  // returns the user query so the caller can re-send it. Used by the retry
  // button on error messages. Returns null when there's nothing to pop.
  removeLastTurn: () => {
    const messages = get().messages;
    if (messages.length === 0) return null;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last.role !== "assistant") return null;
    const userIdx = lastIdx - 1;
    if (userIdx < 0) return null;
    const userMsg = messages[userIdx];
    if (userMsg.role !== "user") return null;
    set({ messages: messages.slice(0, userIdx) });
    return userMsg.content;
  },
});
