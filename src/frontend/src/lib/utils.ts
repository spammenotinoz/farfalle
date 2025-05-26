import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatModel } from "../../generated";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isLocalModel(model: ChatModel) {
  return !isCloudModel(model);
}

export function isCloudModel(model: ChatModel) {
  return [
    ChatModel.GPT_4_1,
    ChatModel.GPT_4_1_MINI,
	ChatModel.CLAUDE_4_SONNET,
  ].includes(model);
}
