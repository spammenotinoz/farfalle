import { StateCreator } from "zustand";
import { ChatModel, ResearchDepth } from "../../../generated";

type State = {
  model: ChatModel;
  researchDepth: ResearchDepth;
};

type Actions = {
  setModel: (model: ChatModel) => void;
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
  researchDepth: ResearchDepth.DEEP,
  setModel: (model: ChatModel) => set({ model }),
  setResearchDepth: (researchDepth: ResearchDepth) => set({ researchDepth }),
});
