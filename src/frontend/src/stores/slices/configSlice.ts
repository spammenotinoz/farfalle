import { env } from "@/env.mjs";
import { StateCreator } from "zustand";
import { ChatModel, ResearchDepth } from "../../../generated";

type State = {
  model: ChatModel;
  localMode: boolean;
  proMode: boolean;
  researchDepth: ResearchDepth;
};

type Actions = {
  setModel: (model: ChatModel) => void;
  toggleLocalMode: () => void;
  toggleProMode: () => void;
  setResearchDepth: (depth: ResearchDepth) => void;
};

export type ConfigStore = State & Actions;

export const createConfigSlice: StateCreator<
  ConfigStore,
  [],
  [],
  ConfigStore
> = (set) => ({
  model: ChatModel.FAST,
  localMode: false,
  proMode: true,
  researchDepth: ResearchDepth.DEEP,
  setModel: (model: ChatModel) => set({ model }),
  setResearchDepth: (researchDepth: ResearchDepth) => set({ researchDepth }),
  toggleLocalMode: () =>
    set((state) => {
      const localModeEnabled = env.NEXT_PUBLIC_LOCAL_MODE_ENABLED;
      if (!localModeEnabled) {
        return { ...state, localMode: false };
      }

      const newLocalMode = !state.localMode;
      const newModel = ChatModel.FAST;
      return { ...state, localMode: newLocalMode, model: newModel };
    }),
  toggleProMode: () =>
    set((state) => {
      const proModeEnabled = env.NEXT_PUBLIC_PRO_MODE_ENABLED;
      if (!proModeEnabled) {
        return { ...state, proMode: false };
      }
      return { ...state, proMode: !state.proMode };
    }),
});
